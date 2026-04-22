import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import SendIcon from '@mui/icons-material/Send';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { messageService } from '@services/api/message.service';

interface Conversation {
  id: string;
  listingTitle: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  otherUser: { id: string; name: string; surname: string; avatar: string };
}

interface Message {
  id: string;
  content: string;
  isMine: boolean;
  isRead: boolean;
  sender: { id: string; name: string; avatar: string };
  createdAt: string;
}

export default function MesajlarSection() {
  const [view, setView] = useState<'list' | 'chat'>('list');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const res = await messageService.getConversations();
      setConversations(res.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const openConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    setView('chat');
    setLoading(true);
    try {
      const res = await messageService.getMessages(conv.id);
      setMessages((res.data || []).reverse());
      await messageService.markAsRead(conv.id);
    } catch { /* ignore */ }
    setLoading(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConv || sending) return;
    setSending(true);
    try {
      await messageService.sendMessage(activeConv.id, newMessage.trim());
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        content: newMessage.trim(),
        isMine: true,
        isRead: false,
        sender: { id: '', name: '', avatar: '' },
        createdAt: new Date().toISOString(),
      }]);
      setNewMessage('');
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch { /* ignore */ }
    setSending(false);
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Az önce';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}dk`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}sa`;
    return d.toLocaleDateString('tr-TR');
  };

  if (view === 'chat' && activeConv) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: 400 }}>
        {/* Chat header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderBottom: '1px solid #eee' }}>
          <Avatar src={activeConv.otherUser.avatar} sx={{ width: 32, height: 32 }}>
            {activeConv.otherUser.name?.[0]}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              {activeConv.otherUser.name} {activeConv.otherUser.surname}
            </Typography>
            {activeConv.listingTitle && (
              <Typography variant="caption" color="text.secondary" noWrap>{activeConv.listingTitle}</Typography>
            )}
          </Box>
          <Chip label="Geri" size="small" onClick={() => setView('list')} />
        </Box>

        {/* Messages */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {loading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} height={40} width={i % 2 ? '60%' : '70%'} sx={{ ml: i % 2 ? 'auto' : 0 }} />)
          ) : messages.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" mt={4}>Henüz mesaj yok</Typography>
          ) : (
            messages.map((msg) => (
              <Box
                key={msg.id}
                sx={{
                  maxWidth: '80%',
                  alignSelf: msg.isMine ? 'flex-end' : 'flex-start',
                  bgcolor: msg.isMine ? '#0099cc' : '#f0f0f0',
                  color: msg.isMine ? '#fff' : 'text.primary',
                  borderRadius: 2,
                  px: 1.5,
                  py: 0.8,
                }}
              >
                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{msg.content}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.65rem' }}>{formatTime(msg.createdAt)}</Typography>
              </Box>
            ))
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input */}
        <Box sx={{ display: 'flex', gap: 1, p: 1, borderTop: '1px solid #eee' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Mesajınız..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          />
          <IconButton color="primary" onClick={handleSend} disabled={sending || !newMessage.trim()}>
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {loading ? (
        <Box sx={{ p: 2 }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} height={60} sx={{ mb: 1 }} />)}
        </Box>
      ) : conversations.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <ChatBubbleOutlineIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">Henüz mesajınız yok</Typography>
        </Box>
      ) : (
        <List disablePadding>
          {conversations.map((conv) => (
            <ListItemButton key={conv.id} onClick={() => openConversation(conv)} sx={{ py: 1.5 }}>
              <ListItemIcon sx={{ minWidth: 48 }}>
                <Badge badgeContent={conv.unreadCount} color="error" max={9}>
                  <Avatar src={conv.otherUser.avatar} sx={{ width: 40, height: 40 }}>
                    {conv.otherUser.name?.[0]}
                  </Avatar>
                </Badge>
              </ListItemIcon>
              <ListItemText
                primary={`${conv.otherUser.name} ${conv.otherUser.surname || ''}`}
                secondary={conv.lastMessage}
                primaryTypographyProps={{ fontWeight: conv.unreadCount ? 700 : 500, fontSize: '0.85rem' }}
                secondaryTypographyProps={{ noWrap: true, fontSize: '0.75rem' }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1, whiteSpace: 'nowrap' }}>
                {formatTime(conv.lastMessageAt)}
              </Typography>
            </ListItemButton>
          ))}
        </List>
      )}
    </Box>
  );
}
