import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import List from '@mui/material/List';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Divider from '@mui/material/Divider';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { qaService } from '@services/api/qa.service';

interface Question {
  id: string;
  content: string;
  listingTitle: string;
  listingType: string;
  isAnswered: boolean;
  createdAt: string;
  user?: { id: string; name: string; surname?: string };
  answer: { id: string; content: string; createdAt: string; user?: { id: string; name: string } } | null;
}

export default function SoruCevapSection() {
  const [tab, setTab] = useState(0);
  const [myQuestions, setMyQuestions] = useState<Question[]>([]);
  const [sellerQuestions, setSellerQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [answerInputs, setAnswerInputs] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 0) {
        const res = await qaService.getMyQuestions();
        setMyQuestions(res.data || []);
      } else {
        const res = await qaService.getSellerQuestions();
        setSellerQuestions(res.data || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleAnswer = async (questionId: string) => {
    const content = answerInputs[questionId]?.trim();
    if (!content) return;
    setSubmitting(questionId);
    try {
      await qaService.answerQuestion(questionId, content);
      setSellerQuestions((prev) =>
        prev.map((q) => q.id === questionId
          ? { ...q, isAnswered: true, answer: { id: 'new', content, createdAt: new Date().toISOString() } }
          : q
        )
      );
      setAnswerInputs((prev) => ({ ...prev, [questionId]: '' }));
    } catch { /* ignore */ }
    setSubmitting(null);
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('tr-TR');

  const renderSkeleton = () => (
    <Box sx={{ p: 2 }}>
      {[1, 2, 3].map((i) => <Skeleton key={i} height={80} sx={{ mb: 1 }} />)}
    </Box>
  );

  const renderEmpty = (text: string) => (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <HelpOutlineIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
      <Typography variant="body2" color="text.secondary">{text}</Typography>
    </Box>
  );

  const renderQuestionCard = (q: Question, showAnswerInput: boolean) => (
    <Card key={q.id} variant="outlined" sx={{ mb: 1.5, mx: 1.5 }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        {/* Soru başlığı */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          {q.isAnswered
            ? <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
            : <HelpOutlineIcon sx={{ fontSize: 16, color: 'warning.main' }} />}
          <Chip
            label={q.listingTitle || (q.listingType === 'oto' ? 'Araç İlanı' : 'Emlak İlanı')}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.65rem', height: 20 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
            {formatDate(q.createdAt)}
          </Typography>
        </Box>

        {/* Soru içeriği */}
        <Typography variant="body2" sx={{ fontSize: '0.85rem', mb: 1 }}>
          {showAnswerInput && q.user && (
            <Typography component="span" variant="caption" color="text.secondary" fontWeight={600}>
              {q.user.name} {q.user.surname}: {' '}
            </Typography>
          )}
          {q.content}
        </Typography>

        {/* Cevap */}
        {q.answer && (
          <>
            <Divider sx={{ my: 0.5 }} />
            <Box sx={{ bgcolor: '#f5f5f5', borderRadius: 1, p: 1, mt: 0.5 }}>
              <Typography variant="caption" color="primary" fontWeight={600}>Cevap:</Typography>
              <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{q.answer.content}</Typography>
              <Typography variant="caption" color="text.secondary">{formatDate(q.answer.createdAt)}</Typography>
            </Box>
          </>
        )}

        {/* Cevap input (satıcı için) */}
        {showAnswerInput && !q.isAnswered && (
          <Box sx={{ mt: 1, display: 'flex', gap: 0.5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Cevabınız..."
              value={answerInputs[q.id] || ''}
              onChange={(e) => setAnswerInputs((prev) => ({ ...prev, [q.id]: e.target.value }))}
              multiline
              maxRows={3}
            />
            <Button
              variant="contained"
              size="small"
              onClick={() => handleAnswer(q.id)}
              disabled={submitting === q.id || !answerInputs[q.id]?.trim()}
              sx={{ minWidth: 70 }}
            >
              Cevapla
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ borderBottom: '1px solid #eee' }}>
        <Tab label="Sorduklarım" sx={{ fontSize: '0.75rem', minHeight: 42 }} />
        <Tab label="Bana Sorulan" sx={{ fontSize: '0.75rem', minHeight: 42 }} />
      </Tabs>

      {loading ? renderSkeleton() : (
        <Box sx={{ py: 1 }}>
          {tab === 0 && (
            myQuestions.length === 0
              ? renderEmpty('Henüz soru sormadınız')
              : <List disablePadding>{myQuestions.map((q) => renderQuestionCard(q, false))}</List>
          )}
          {tab === 1 && (
            sellerQuestions.length === 0
              ? renderEmpty('Size henüz soru sorulmadı')
              : <List disablePadding>{sellerQuestions.map((q) => renderQuestionCard(q, true))}</List>
          )}
        </Box>
      )}
    </Box>
  );
}
