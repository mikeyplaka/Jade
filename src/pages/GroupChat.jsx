import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function GroupChat() {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['chatMessages', 'general'],
    queryFn: () => base44.entities.ChatMessage.filter({ channel: 'general' }, 'created_date', 100),
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: (msg) => base44.entities.ChatMessage.create(msg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', 'general'] });
      setText('');
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    sendMutation.mutate({
      sender_email: user.email,
      sender_name: user.full_name,
      message: text.trim(),
      channel: 'general',
    });
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-4rem)] p-4 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold">Company Chat</h1>
        </div>
        <p className="text-sm text-muted-foreground">General channel — visible to all team members</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">No messages yet. Start the conversation!</p>
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.sender_email === user?.email;
            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                    {msg.sender_name?.[0] || '?'}
                  </div>
                )}
                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                  {!isMe && (
                    <p className="text-xs text-muted-foreground px-1">{msg.sender_name || msg.sender_email}</p>
                  )}
                  <div className={`px-3 py-2 rounded-2xl text-sm ${
                    isMe
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-muted text-foreground rounded-tl-sm'
                  }`}>
                    {msg.message}
                  </div>
                  <p className="text-[10px] text-muted-foreground px-1">
                    {formatDistanceToNow(new Date(msg.created_date), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="border-t p-3">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
              autoComplete="off"
            />
            <Button type="submit" size="icon" disabled={!text.trim() || sendMutation.isPending}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}