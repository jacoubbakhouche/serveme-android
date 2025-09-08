import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import LoadingSpinner from '@/components/LoadingSpinner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tables } from '@/integrations/supabase/types';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

type Profile = Tables<'profiles'>;
type MessageWithProfiles = Tables<'messages'> & { sender: Profile; receiver: Profile };

interface Conversation {
  user: Profile;
  lastMessage: Tables<'messages'>;
}

const getInitials = (name: string) => {
  if (!name) return '';
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

const MessagesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: conversations, isLoading } = useQuery<Conversation[], Error>({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:profiles!sender_id(*), receiver:profiles!receiver_id(*)')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        throw error;
      }

      const conversationMap = new Map<string, Conversation>();

      (data as MessageWithProfiles[]).forEach(message => {
        const otherUser = message.sender_id === user.id ? message.receiver : message.sender;
        if (otherUser && !conversationMap.has(otherUser.id)) {
          conversationMap.set(otherUser.id, {
            user: otherUser,
            lastMessage: message,
          });
        }
      });

      return Array.from(conversationMap.values());
    },
    enabled: !!user?.id,
  });

  return (
    <Card className="bg-black/50 backdrop-blur-sm border-none shadow-lg text-white">
      <CardHeader className="flex items-center justify-between border-b border-white/10">
        <CardTitle className="text-lg font-bold">😶‍🌫️💌محادثاتك</CardTitle>
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-full hover:bg-white/20 transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </CardHeader>

      <CardContent>
        {isLoading && (
          <div className="flex justify-center p-8">
            <LoadingSpinner />
          </div>
        )}

        {!isLoading && conversations && conversations.length > 0 ? (
          <div className="space-y-3">
            {conversations.map(convo => (
              <div
                key={convo.user.id}
                className="flex flex-row-reverse items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer border border-white/10"
                onClick={() => navigate(`/chat/${convo.user.id}`)}
              >
                <Avatar className="h-12 w-12 ring-2 ring-primary">
                  <AvatarImage src={convo.user.avatar_url || undefined} />
                  <AvatarFallback>{getInitials(convo.user.full_name || '')}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden text-right">
                  <div className="flex flex-row-reverse justify-between items-baseline">
                    <p className="font-semibold truncate">{convo.user.full_name}</p>
                    <p className="text-xs text-gray-300 whitespace-nowrap">
                      {formatDistanceToNow(new Date(convo.lastMessage.created_at), {
                        addSuffix: true,
                        locale: ar,
                      })}
                    </p>
                  </div>
                  <p className="text-sm text-gray-300 truncate">
                    {convo.lastMessage.sender_id === user?.id ? 'أنت: ' : ''}
                    {convo.lastMessage.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !isLoading && (
            <p className="text-center text-gray-300 p-8">
              لا توجد محادثات حتى الآن.
            </p>
          )
        )}
      </CardContent>
    </Card>
  );
};

export default MessagesPage;
