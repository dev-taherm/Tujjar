"use client";

import { useState, useRef, useEffect } from "react";
import { useAIConversations, useCreateAIConversation, useSendAIMessage } from "@/api/queries";
import { Button } from "@/shared/ui";
import { Send, Plus, MessageSquare, Bot, User, Loader2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export function AIAssistant() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations } = useAIConversations();
  const createConversation = useCreateAIConversation();
  const sendMessage = useSendAIMessage();
  const [localMessages, setLocalMessages] = useState<Array<{ role: string; content: string }>>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [localMessages]);

  const handleNewConversation = async () => {
    const conv = await createConversation.mutateAsync({ title: "New Chat", context_type: "chat" });
    setSelectedConversation(conv.id);
    setLocalMessages([]);
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedConversation) return;
    const userMsg = input.trim();
    setInput("");
    setLocalMessages((prev) => [...prev, { role: "user", content: userMsg }]);

    try {
      const result = await sendMessage.mutateAsync({ conversationId: selectedConversation, message: userMsg });
      setLocalMessages((prev) => [...prev, { role: "assistant", content: result.content }]);
    } catch {
      setLocalMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    }
  };

  return (
    <div className="flex h-[calc(100vh-160px)] overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 flex flex-col">
        <div className="p-3 border-b border-gray-200">
          <Button onClick={handleNewConversation} className="w-full" size="sm">
            <Plus className="mr-1 h-4 w-4" /> New Chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations?.map((conv) => (
            <button
              key={conv.id}
              onClick={() => { setSelectedConversation(conv.id); setLocalMessages([]); }}
              className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                selectedConversation === conv.id ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <MessageSquare className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{conv.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {!selectedConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Bot className="mb-4 h-16 w-16 text-gray-300" />
            <h2 className="mb-2 text-xl font-semibold text-gray-900">AI Assistant</h2>
            <p className="mb-6 text-sm text-gray-500">Ask me anything about your store, products, or analytics.</p>
            <Button onClick={handleNewConversation}>
              <Plus className="mr-2 h-4 w-4" /> Start a Conversation
            </Button>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {localMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bot className="mb-3 h-12 w-12 text-gray-300" />
                  <p className="text-sm text-gray-500">Send a message to start the conversation.</p>
                </div>
              )}
              {localMessages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                  <div className={`max-w-[70%] rounded-xl px-4 py-3 text-sm ${
                    msg.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
              {sendMessage.isPending && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="rounded-xl bg-gray-100 px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Ask me anything..."
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <Button onClick={handleSend} disabled={!input.trim() || sendMessage.isPending}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
