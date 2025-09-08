import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, BadgeCheck, Paperclip, X, Loader2, Mic, StopCircle, Plus, Trash2 } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import { Tables } from '@/integrations/supabase/types';
import { CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ProviderChatProps {
  receiverId: string;
  receiverName: string;
  receiverAvatarUrl: string | null;
  receiverIsVerified: boolean;
}

type Message = Tables<'messages'> & {
  message_type?: string;
  media_url?: string | null;
};

const getInitials = (name: string) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

const ProviderChat = ({ receiverId, receiverName, receiverAvatarUrl, receiverIsVerified }: ProviderChatProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);

  const senderId = user?.id;

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ['messages', senderId, receiverId],
    queryFn: async () => {
      if (!senderId) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!senderId,
  });

  // ✨ 1. دالة جديدة لاستدعاء "ساعي البريد" (Edge Function)
  const triggerPushNotification = async (messageContent: string) => {
    if (!user) return;

    // الحصول على اسم المرسل من جدول profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const senderName = profile?.full_name || 'مستخدم';
    
    // استدعاء الدالة التي قمنا بنشرها
    const { error } = await supabase.functions.invoke('send-notification', {
      body: {
        receiverId: receiverId,
        senderName: senderName,
        messageContent: messageContent,
      },
    });

    if (error) {
      console.error('Error triggering push notification function:', error.message);
    }
  };


  const createMessageNotification = async () => {
    if (!user || !receiverId) return;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();
    
    const senderName = profile?.full_name || 'مستخدم مجهول';
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: receiverId,
        type: 'message',
        message: `لديك رسالة جديدة من ${senderName}.`,
        is_read: false,
      });
    if (notificationError) {
      console.error('Failed to create notification:', notificationError);
    } else {
      queryClient.invalidateQueries({ queryKey: ['unread_notifications', receiverId] });
    }
  };

  const sendTextMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!senderId) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from('messages')
        .insert([{ content, sender_id: senderId, receiver_id: receiverId, message_type: 'text' }])
        .select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: async (data) => { // ✨ 2. تم تعديل onSuccess
      queryClient.invalidateQueries({ queryKey: ['messages', senderId, receiverId] });
      setNewMessage('');
      createMessageNotification(); // هذا للإشعار الداخلي
      // ✨ استدعاء ساعي البريد بعد إرسال الرسالة النصية
      if (data?.content) {
        await triggerPushNotification(data.content);
      }
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!senderId) throw new Error("User not authenticated");
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `public/${senderId}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(filePath, file);
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
      const { data: urlData } = supabase.storage
        .from('chat-media')
        .getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;
      const messageType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file';
      const { data, error: insertError } = await supabase
        .from('messages')
        .insert([{
          sender_id: senderId,
          receiver_id: receiverId,
          message_type: messageType,
          media_url: publicUrl,
          content: newMessage
        }])
        .select().single();
      if (insertError) throw new Error(`Failed to send message: ${insertError.message}`);
      return data;
    },
    onSuccess: async () => { // ✨ 3. تم تعديل onSuccess
      queryClient.invalidateQueries({ queryKey: ['messages', senderId, receiverId] });
      setFileToUpload(null);
      setPreviewUrl(null);
      setNewMessage('');
      createMessageNotification();
      // ✨ استدعاء ساعي البريد بعد إرسال الملف
      await triggerPushNotification(newMessage || 'أرسل لك ملفًا');
    },
    onError: (error) => {
      toast({ title: "خطأ في الإرسال", description: error.message, variant: "destructive" });
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  const sendAudioMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      if (!senderId) throw new Error("User not authenticated");
      setIsUploading(true);
      const fileName = `${Date.now()}.mp3`;
      const filePath = `public/${senderId}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(filePath, audioBlob);
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
      const { data: urlData } = supabase.storage
        .from('chat-media')
        .getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;
      const { data, error: insertError } = await supabase
        .from('messages')
        .insert([{
          sender_id: senderId,
          receiver_id: receiverId,
          message_type: 'audio',
          media_url: publicUrl,
          content: ''
        }])
        .select().single();
      if (insertError) throw new Error(`Failed to send message: ${insertError.message}`);
      return data;
    },
    onSuccess: async () => { // ✨ 4. تم تعديل onSuccess
      queryClient.invalidateQueries({ queryKey: ['messages', senderId, receiverId] });
      setIsUploading(false);
      setAudioBlob(null);
      createMessageNotification();
      // ✨ استدعاء ساعي البريد بعد إرسال الرسالة الصوتية
      await triggerPushNotification('أرسل لك رسالة صوتية');
    },
    onError: (error) => {
      toast({ title: "خطأ في الإرسال", description: error.message, variant: "destructive" });
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });
  
  const startRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = event => {
        audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        setAudioBlob(audioBlob);
        setShowAttachmentOptions(false);
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast({ title: "بدأ التسجيل", description: "جاري تسجيل رسالتك الصوتية...", duration: 2000 });
    } catch (error) {
        if (error instanceof DOMException) {
            if (error.name === 'NotAllowedError') {
              toast({
                title: "تم رفض الإذن",
                description: "للتسجيل الصوتي، يرجى السماح بالوصول للميكروفون من إعدادات المتصفح أو التطبيق.",
                variant: "destructive",
              });
            } else if (error.name === 'NotFoundError') {
              toast({
                title: "لا يوجد ميكروفون",
                description: "لم يتم العثور على جهاز ميكروفون متصل.",
                variant: "destructive",
              });
            } else {
               toast({
                title: "حدث خطأ",
                description: "لم نتمكن من الوصول إلى الميكروفون. حاول مرة أخرى.",
                variant: "destructive",
              });
            }
        } else {
            console.error("An unexpected error occurred:", error);
            toast({
              title: "خطأ غير متوقع",
              description: "حدث خطأ غير متوقع أثناء محاولة بدء التسجيل.",
              variant: "destructive",
            });
        }
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleSendAudio = () => {
    if (audioBlob) {
        sendAudioMutation.mutate(audioBlob);
    }
  };

  const handleCancelAudio = () => {
    setAudioBlob(null);
  };

  useEffect(() => {
    if (!senderId) return;
    const channel = supabase.channel(`messages:${senderId}:${receiverId}`).on<Message>('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },  
    (payload) => {
      queryClient.setQueryData(['messages', senderId, receiverId], (oldData: Message[] | undefined) => {
        if (!oldData) return [payload.new];
        const exists = oldData.some(msg => msg.id === payload.new.id);
        if (exists) return oldData;
        return [...oldData, payload.new];
      });
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [senderId, receiverId, queryClient]);
  
  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(scrollToBottom, [messages]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileToUpload(file);
      setPreviewUrl(URL.createObjectURL(file));
      setShowAttachmentOptions(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (fileToUpload) {
      uploadFileMutation.mutate(fileToUpload);
    } else if (newMessage.trim() !== '') {
      sendTextMessageMutation.mutate(newMessage.trim());
    }
  };
  
  if (!user) return <p>الرجاء تسجيل الدخول للمراسلة.</p>
  if (isLoading) return <div className="flex justify-center items-center h-[70vh]"><LoadingSpinner /></div>;

  return (
    <div className="flex flex-col h-[70vh] bg-black">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar>
          <AvatarImage src={receiverAvatarUrl || undefined} alt={receiverName} />
          <AvatarFallback>{getInitials(receiverName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <CardTitle>{receiverName}</CardTitle>
            {receiverIsVerified && <BadgeCheck className="w-5 h-5 text-sky-500" />}
          </div>
        </div>
      </CardHeader>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages && messages.length > 0 ? (
          messages.map((msg) => (
            <div key={msg.id} className={`flex w-full ${msg.sender_id === senderId ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-2xl ${ msg.sender_id === senderId ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground' } ${msg.message_type === 'audio' ? 'max-w-[200px]' : 'max-w-lg'}`}>
                {msg.message_type?.toLowerCase().trim() === 'audio' && msg.media_url && (<audio src={msg.media_url} controls controlsList="nodownload" style={{ width: '200px', height: '50px' }} />)}
                {msg.message_type === 'image' && msg.media_url && (
                    <img
                        src={msg.media_url}
                        alt="Uploaded content"
                        className="rounded-md max-w-xs max-h-64 object-cover cursor-pointer"
                        onClick={() => setLightboxImageUrl(msg.media_url!)}
                    />
                )}
                {msg.message_type === 'video' && msg.media_url && (
                    <video src={msg.media_url} controls className="rounded-md max-w-xs max-h-64"/>
                )}
                {msg.content && <p className={`text-sm ${msg.media_url ? 'mt-2' : ''}`}>{msg.content}</p>}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-muted-foreground">لا توجد رسائل بعد. ابدأ المحادثة!</p>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border">
        {previewUrl && (
          <div className="relative w-24 h-24 mb-2 p-2 border rounded-md">
            {fileToUpload?.type.startsWith('image/') && <img src={previewUrl} className="w-full h-full object-cover rounded-md"/>}
            {fileToUpload?.type.startsWith('video/') && <video src={previewUrl} className="w-full h-full object-cover rounded-md"/>}
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
              onClick={() => { setFileToUpload(null); setPreviewUrl(null); }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        {audioBlob && (
            <div className="flex items-center gap-2 mb-2 p-2 border rounded-md">
                <audio controls src={URL.createObjectURL(audioBlob)} className="flex-1" />
                <Button variant="ghost" size="icon" onClick={handleSendAudio} disabled={isUploading}>
                    <Send className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleCancelAudio} disabled={isUploading}>
                    <Trash2 className="w-4 h-4 text-red-500"/>
                </Button>
            </div>
        )}

        {!audioBlob && (
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
                {isRecording ? (
                    <div className="flex-1 flex items-center justify-center text-red-500 font-bold">
                        <StopCircle className="w-6 h-6 animate-pulse mr-2" onClick={stopRecording}/>
                        جاري التسجيل...
                    </div>
                ) : (
                    <>
                        {showAttachmentOptions && (
                            <>
                                <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                                    <Paperclip className="w-5 h-5"/>
                                </Button>
                                <Button type="button" variant="ghost" size="icon" onClick={startRecording} disabled={isUploading}>
                                    <Mic className="w-5 h-5"/>
                                </Button>
                            </>
                        )}
                        <Button type="button" variant="ghost" size="icon" onClick={() => setShowAttachmentOptions(!showAttachmentOptions)}>
                            <Plus className={`w-5 h-5 transition-transform ${showAttachmentOptions ? 'rotate-45' : ''}`} />
                        </Button>
                        <Input
                            placeholder={fileToUpload ? "إضافة تعليق..." : "اكتب رسالتك هنا..."}
                            className="flex-1"
                            value={newMessage}
                            onChange={(e) => {setNewMessage(e.target.value); setShowAttachmentOptions(false);}}
                            disabled={isUploading}
                        />
                        <Button type="submit" disabled={isUploading || (!fileToUpload && newMessage.trim() === '')}>
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                    </>
                )}
            </form>
        )}
      </div>
      
      <Dialog open={!!lightboxImageUrl} onOpenChange={() => setLightboxImageUrl(null)}>
        <DialogContent className="max-w-4xl w-full h-[90vh] p-0 bg-black/90 border-none">
          <img src={lightboxImageUrl || ''} alt="Lightbox" className="max-w-full max-h-full object-contain"/>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
            onClick={() => setLightboxImageUrl(null)}
          >
            <X className="h-6 w-6" />
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderChat;

