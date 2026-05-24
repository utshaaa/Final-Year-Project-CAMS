"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Loader2, Check, CheckCheck } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { UserRole } from "@prisma/client"
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

interface Message {
  id: string
  sender: string
  senderId: string
  senderName: string
  text: string
  time: string
  createdAt: string
  isRead: boolean
}

interface Contact {
  id: string
  name: string
  email: string
  role: string
  subject?: string
  subjects?: string[]
  className?: string
  classes?: string[]
  rollNo?: string
  lastMessage?: string
  lastMessageTime?: string
  unreadCount?: number
}

export default function ChatPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastMessageIdRef = useRef<string | null>(null)
  const fetchNewMessagesRef = useRef<(() => Promise<void>) | null>(null)

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/chat/contacts', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch contacts')
      }

      const data = await response.json()
      setContacts(data.contacts || [])

      if (data.contacts && data.contacts.length > 0 && !selectedContact) {
        setSelectedContact(data.contacts[0])
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = useCallback(async () => {
    if (!selectedContact) return

    try {
      setLoadingMessages(true)
      const response = await fetch(`/api/chat/messages?userId=${selectedContact.id}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }

      const data = await response.json()
      const formattedMessages = (data.messages || []).map((msg: any) => ({
        ...msg,
        time: format(new Date(msg.time), 'h:mm a'),
        createdAt: msg.time,
      }))
      setMessages(formattedMessages)
      
      if (formattedMessages.length > 0) {
        lastMessageIdRef.current = formattedMessages[formattedMessages.length - 1].id
      }
      
      scrollToBottom()
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoadingMessages(false)
    }
  }, [selectedContact])

  const fetchNewMessages = useCallback(async () => {
    if (!selectedContact || !lastMessageIdRef.current) return

    try {
      const response = await fetch(`/api/chat/messages?userId=${selectedContact.id}&after=${lastMessageIdRef.current}`, {
        credentials: 'include',
      })

      if (!response.ok) return

      const data = await response.json()
      if (data.messages && data.messages.length > 0) {
        const formattedNewMessages = data.messages.map((msg: any) => ({
          ...msg,
          time: format(new Date(msg.time), 'h:mm a'),
          createdAt: msg.time,
        }))
        setMessages(prev => [...prev, ...formattedNewMessages])
        lastMessageIdRef.current = formattedNewMessages[formattedNewMessages.length - 1].id
        scrollToBottom()
      }
    } catch (error) {
      console.error('Error fetching new messages:', error)
    }
  }, [selectedContact])

  fetchNewMessagesRef.current = fetchNewMessages

  useEffect(() => {
    if (user) {
      fetchContacts()
      const contactsInterval = setInterval(() => {
        fetchContacts()
      }, 5000)
      return () => {
        clearInterval(contactsInterval)
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
        }
      }
    }
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [user])

  useEffect(() => {
    if (!selectedContact) return

    fetchMessages()
    lastMessageIdRef.current = null
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }
    
    pollingIntervalRef.current = setInterval(() => {
      if (fetchNewMessagesRef.current) {
        fetchNewMessagesRef.current()
      }
    }, 2000)
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [selectedContact, fetchMessages])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedContact || sending || !user) return

    try {
      setSending(true)
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          receiverId: selectedContact.id,
          content: newMessage.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send message')
      }

      const newMsg = await response.json()
      const formattedMsg = {
        ...newMsg,
        time: format(new Date(newMsg.time), 'h:mm a'),
        createdAt: newMsg.time,
        senderId: user.id,
      }
      setMessages(prev => [...prev, formattedMsg])
      lastMessageIdRef.current = formattedMsg.id
      setNewMessage("")
      scrollToBottom()
    } catch (error: any) {
      console.error('Error sending message:', error)
      toast({ title: 'Error', description: error.message || 'Failed to send message', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Please log in to use chat</div>
      </div>
    )
  }

  if (user.role !== UserRole.STUDENT && user.role !== UserRole.TEACHER) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Chat is only available for students and teachers</div>
      </div>
    )
  }

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isToday(date)) {
      return format(date, 'h:mm a')
    } else if (isYesterday(date)) {
      return 'Yesterday'
    } else {
      return format(date, 'MMM d, yyyy')
    }
  }

  const formatContactTime = (dateStr?: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    if (isToday(date)) {
      return format(date, 'h:mm a')
    } else if (isYesterday(date)) {
      return 'Yesterday'
    } else {
      return format(date, 'MMM d')
    }
  }

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { [key: string]: Message[] } = {}
    msgs.forEach(msg => {
      const date = new Date(msg.createdAt)
      const dateKey = format(date, 'yyyy-MM-dd')
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(msg)
    })
    return groups
  }

  const getDateLabel = (dateKey: string) => {
    const date = new Date(dateKey)
    if (isToday(date)) {
      return 'Today'
    } else if (isYesterday(date)) {
      return 'Yesterday'
    } else {
      return format(date, 'MMMM d, yyyy')
    }
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        <div className="w-full md:w-1/3 border-r border-border flex flex-col bg-background">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold">
              {user.role === UserRole.STUDENT ? "Teachers" : "Students"}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : contacts.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No {user.role === UserRole.STUDENT ? "teachers" : "students"} available
              </div>
            ) : (
              <div className="divide-y divide-border">
                {contacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className={`w-full text-left p-3 hover:bg-muted/50 transition-colors ${
                      selectedContact?.id === contact.id ? "bg-muted" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium text-foreground truncate">{contact.name}</div>
                          {contact.lastMessageTime && (
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {formatContactTime(contact.lastMessageTime)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-sm text-muted-foreground truncate flex-1">
                            {contact.lastMessage || 'No messages yet'}
                          </p>
                          {contact.unreadCount && contact.unreadCount > 0 && (
                            <span className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
                              {contact.unreadCount}
                            </span>
                          )}
                        </div>
                        {(contact.subjects?.length || contact.classes?.length) ? (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {contact.subjects?.map((s) => (
                              <Badge key={`s-${s}`} variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                                {s}
                              </Badge>
                            ))}
                            {contact.classes?.map((c) => (
                              <Badge key={`c-${c}`} variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                                {c}
                              </Badge>
                            ))}
                            {contact.rollNo && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">
                                #{contact.rollNo}
                              </Badge>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-background">
          {!selectedContact ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-medium mb-2">Select a contact to start chatting</p>
                <p className="text-sm">Choose a {user.role === UserRole.STUDENT ? "teacher" : "student"} from the list</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {selectedContact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground">{selectedContact.name}</div>
                    {(selectedContact.subjects?.length || selectedContact.classes?.length || selectedContact.rollNo) ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedContact.subjects?.map((s) => (
                          <Badge key={`hs-${s}`} variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                            {s}
                          </Badge>
                        ))}
                        {selectedContact.classes?.map((c) => (
                          <Badge key={`hc-${c}`} variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                            {c}
                          </Badge>
                        ))}
                        {selectedContact.rollNo && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">
                            #{selectedContact.rollNo}
                          </Badge>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 bg-muted/20">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <p className="text-lg font-medium mb-2">No messages yet</p>
                      <p className="text-sm">Start the conversation!</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupMessagesByDate(messages)).map(([dateKey, dateMessages]) => (
                      <div key={dateKey}>
                        <div className="flex items-center justify-center my-4">
                          <div className="bg-background px-3 py-1 rounded-full text-xs text-muted-foreground border border-border">
                            {getDateLabel(dateKey)}
                          </div>
                        </div>
                        {dateMessages.map((message) => {
                          const isOwn = message.senderId === user.id
                          return (
                            <div
                              key={message.id}
                              className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-1`}
                            >
                              <div
                                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                                  isOwn
                                    ? "bg-primary text-primary-foreground rounded-br-sm"
                                    : "bg-background text-foreground border border-border rounded-bl-sm"
                                }`}
                              >
                                {!isOwn && (
                                  <p className="text-xs font-medium mb-1 opacity-80">{message.senderName}</p>
                                )}
                                <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                                <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                                  <span
                                    className={`text-xs ${
                                      isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                                    }`}
                                  >
                                    {message.time}
                                  </span>
                                  {isOwn && (
                                    <span className="text-primary-foreground/70">
                                      {message.isRead ? (
                                        <CheckCheck className="h-3 w-3" />
                                      ) : (
                                        <Check className="h-3 w-3" />
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-border bg-background">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} size="icon" disabled={sending || !newMessage.trim()}>
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
