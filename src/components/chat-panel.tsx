'use client';

import { useState, useEffect, useRef } from 'react';
import { diagnose } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './chat-message';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Send, RefreshCw, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from './ui/avatar';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [mbtiType, setMbtiType] = useState<string | undefined>(undefined);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const startDiagnosis = async () => {
    setIsLoading(true);
    setIsFinished(false);
    setMbtiType(undefined);
    setMessages([]);
    setInput('');

    try {
      const result = await diagnose({ userInput: "Start the diagnosis." });
      if (result.chatbotResponse.includes("error")) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.chatbotResponse,
        });
      } else {
        setMessages([{ role: 'assistant', content: result.chatbotResponse }]);
        setMbtiType(result.mbtiType);
        setIsFinished(result.isFinalAnswer);
      }
    } catch (e) {
      console.error("Error starting diagnosis:", e);
      toast({
        variant: "destructive",
        title: "An unexpected error occurred",
        description: "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    startDiagnosis();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isFinished) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await diagnose({
        userInput: input,
        conversationHistory: messages,
        mbtiType: mbtiType,
      });

      if (result.chatbotResponse.includes("error")) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.chatbotResponse,
        });
        setMessages(prev => prev.slice(0, -1));
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: result.chatbotResponse }]);
        setMbtiType(result.mbtiType);
        setIsFinished(result.isFinalAnswer);
      }
    } catch (e) {
      console.error("Error submitting message:", e);
      toast({
        variant: "destructive",
        title: "An unexpected error occurred",
        description: "Could not get a response. Please try again.",
      });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl h-[90vh] md:h-[80vh] flex flex-col shadow-2xl rounded-2xl bg-card/80 backdrop-blur-sm border-primary/20">
      <CardHeader className="border-b border-primary/20">
        <CardTitle className="flex items-center justify-between text-primary-foreground font-headline">
          <span className="text-lg">MBTI Alchemist</span>
          <Button variant="ghost" size="icon" onClick={startDiagnosis} aria-label="Start new diagnosis" disabled={isLoading && !isFinished}>
            <RefreshCw className={`h-5 w-5 ${isLoading && !isFinished ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="p-4 sm:p-6 space-y-6">
            {messages.map((msg, index) => (
              <ChatMessage key={index} role={msg.role} content={msg.content} />
            ))}
            {isLoading && (
               <div className="flex items-start gap-3 justify-start">
                  <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                    <AvatarFallback>
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="max-w-[75%] rounded-lg p-3 text-sm shadow-md bg-card flex items-center">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 border-t border-primary/20">
        {isFinished ? (
          <div className="w-full text-center text-muted-foreground text-sm">
            Diagnosis complete. Start a new one using the refresh icon.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your answer..."
              disabled={isLoading}
              autoComplete="off"
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()} size="icon" aria-label="Send message">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        )}
      </CardFooter>
    </Card>
  );
}
