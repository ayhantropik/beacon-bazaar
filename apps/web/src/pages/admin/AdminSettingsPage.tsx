import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import CategoryIcon from '@mui/icons-material/Category';
import PercentIcon from '@mui/icons-material/Percent';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import EditIcon from '@mui/icons-material/Edit';
import adminService from '@services/api/admin.service';

interface SubGroup {
  title: string;
  items: string[];
}

export default function AdminSettingsPage() {
  const [platformName, setPlatformName] = useState('VeniVidiCoop');
  const [defaultCommission, setDefaultCommission] = useState('10');
  const [currency, setCurrency] = useState('TRY');
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<Record<string, SubGroup[]>>({});
  const [categoryCommissions, setCategoryCommissions] = useState<Record<string, number>>({});
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' as 'success' | 'error' });

  // Subcategory dialog state
  const [subDialog, setSubDialog] = useState<{
    open: boolean;
    category: string;
    groupIndex: number | null; // null = new group
    title: string;
    items: string;
  }>({ open: false, category: '', groupIndex: null, title: '', items: '' });

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, catRes, subRes] = await Promise.all([
        adminService.getSettings(),
        adminService.getCategories(),
        adminService.getSubcategories(),
      ]);
      if (settingsRes?.data) {
        if (settingsRes.data.platformName) setPlatformName(settingsRes.data.platformName);
        if (settingsRes.data.defaultCommission) setDefaultCommission(String(settingsRes.data.defaultCommission));
        if (!settingsRes.data.defaultCommission && settingsRes.data.commissionRate) setDefaultCommission(String(settingsRes.data.commissionRate));
        if (settingsRes.data.currency) setCurrency(settingsRes.data.currency);
        if (settingsRes.data.categoryCommissions) setCategoryCommissions(settingsRes.data.categoryCommissions);
      }
      if (catRes?.data) {
        setCategories(catRes.data);
      }
      if (subRes?.data) {
        setSubcategories(subRes.data);
      }
    } catch {
      // Use defaults on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await Promise.all([
        adminService.updateSetting('platformName', platformName),
        adminService.updateSetting('defaultCommission', Number(defaultCommission)),
        adminService.updateSetting('currency', currency),
        adminService.updateSetting('categoryCommissions', categoryCommissions),
      ]);
      setSnack({ open: true, msg: 'Ayarlar kaydedildi', severity: 'success' });
    } catch {
      setSnack({ open: true, msg: 'Kayıt başarısız', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCategories = async (updated: string[]) => {
    setCategories(updated);
    try {
      await adminService.updateCategories(updated);
      setSnack({ open: true, msg: 'Kategoriler güncellendi', severity: 'success' });
    } catch {
      setSnack({ open: true, msg: 'Kategori güncellenemedi', severity: 'error' });
    }
  };

  const handleSaveSubcategories = async (updated: Record<string, SubGroup[]>) => {
    setSubcategories(updated);
    try {
      await adminService.updateSubcategories(updated);
      setSnack({ open: true, msg: 'Alt kategoriler güncellendi', severity: 'success' });
    } catch {
      setSnack({ open: true, msg: 'Alt kategori güncellenemedi', severity: 'error' });
    }
  };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      handleSaveCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const removeCategory = (cat: string) => {
    handleSaveCategories(categories.filter((c) => c !== cat));
    const updatedCommissions = { ...categoryCommissions };
    delete updatedCommissions[cat];
    setCategoryCommissions(updatedCommissions);
    // Remove subcategories for this category
    if (subcategories[cat]) {
      const updatedSubs = { ...subcategories };
      delete updatedSubs[cat];
      handleSaveSubcategories(updatedSubs);
    }
  };

  const handleCommissionChange = (cat: string, value: string) => {
    const num = value === '' ? 0 : Number(value);
    if (isNaN(num) || num < 0 || num > 100) return;
    setCategoryCommissions((prev) => ({ ...prev, [cat]: num }));
  };

  const getEffectiveCommission = (cat: string): number => {
    if (categoryCommissions[cat] !== undefined && categoryCommissions[cat] > 0) {
      return categoryCommissions[cat];
    }
    return Number(defaultCommission) || 10;
  };

  // ─── Subcategory handlers ───────────────────────────────────

  const openAddSubGroup = (category: string) => {
    setSubDialog({ open: true, category, groupIndex: null, title: '', items: '' });
  };

  const openEditSubGroup = (category: string, groupIndex: number) => {
    const group = subcategories[category]?.[groupIndex];
    if (!group) return;
    setSubDialog({
      open: true,
      category,
      groupIndex,
      title: group.title,
      items: group.items.join(', '),
    });
  };

  const handleSaveSubGroup = () => {
    const { category, groupIndex, title, items } = subDialog;
    if (!title.trim()) return;
    const itemList = items.split(',').map((s) => s.trim()).filter(Boolean);
    const catSubs = [...(subcategories[category] || [])];

    if (groupIndex !== null) {
      catSubs[groupIndex] = { title: title.trim(), items: itemList };
    } else {
      catSubs.push({ title: title.trim(), items: itemList });
    }

    handleSaveSubcategories({ ...subcategories, [category]: catSubs });
    setSubDialog({ open: false, category: '', groupIndex: null, title: '', items: '' });
  };

  const handleDeleteSubGroup = (category: string, groupIndex: number) => {
    const catSubs = [...(subcategories[category] || [])];
    catSubs.splice(groupIndex, 1);
    const updated = { ...subcategories };
    if (catSubs.length === 0) {
      delete updated[category];
    } else {
      updated[category] = catSubs;
    }
    handleSaveSubcategories(updated);
  };

  const handleDeleteSubItem = (category: string, groupIndex: number, itemIndex: number) => {
    const catSubs = [...(subcategories[category] || [])];
    const group = { ...catSubs[groupIndex] };
    group.items = group.items.filter((_, i) => i !== itemIndex);
    catSubs[groupIndex] = group;
    handleSaveSubcategories({ ...subcategories, [category]: catSubs });
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={700} mb={3}>Sistem Ayarları</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}><Skeleton variant="rounded" height={300} /></Grid>
          <Grid item xs={12} md={6}><Skeleton variant="rounded" height={300} /></Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Sistem Ayarları</Typography>

      <Grid container spacing={3}>
        {/* Platform Settings */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <SettingsIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>Platform Ayarları</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <TextField
                label="Platform Adı"
                fullWidth
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Varsayılan Komisyon Oranı (%)"
                fullWidth
                type="number"
                value={defaultCommission}
                onChange={(e) => setDefaultCommission(e.target.value)}
                helperText="Kategori bazlı oran belirtilmediğinde uygulanacak varsayılan komisyon"
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Para Birimi"
                fullWidth
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                sx={{ mb: 3 }}
              />

              <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveSettings} disabled={saving}>
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Category Management */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <CategoryIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>Kategori Yönetimi</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Box display="flex" gap={1} mb={2}>
                <TextField
                  size="small"
                  placeholder="Yeni kategori..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                  sx={{ flex: 1 }}
                />
                <Button variant="outlined" startIcon={<AddIcon />} onClick={addCategory} disabled={!newCategory.trim()}>
                  Ekle
                </Button>
              </Box>

              <Box display="flex" flexWrap="wrap" gap={0.8}>
                {categories.map((cat) => (
                  <Chip
                    key={cat}
                    label={cat}
                    onDelete={() => removeCategory(cat)}
                    deleteIcon={<DeleteIcon />}
                    sx={{ fontSize: 13 }}
                  />
                ))}
              </Box>

              <Typography variant="caption" color="text.secondary" display="block" mt={2}>
                {categories.length} kategori tanımlı — Değişiklikler anında kaydedilir
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Subcategory Management */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <AccountTreeIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>Alt Kategori Yönetimi</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Typography variant="body2" color="text.secondary" mb={2}>
                Her ana kategori altına alt gruplar ve bunların detay kalemleri ekleyebilirsiniz. Mega menüde görüneceklerdir.
              </Typography>

              {categories.length === 0 ? (
                <Typography color="text.secondary" py={2} textAlign="center">Önce ana kategori ekleyin</Typography>
              ) : (
                categories.map((cat) => {
                  const groups = subcategories[cat] || [];
                  return (
                    <Accordion key={cat} sx={{ mb: 1, borderRadius: '8px !important', '&:before': { display: 'none' } }} variant="outlined">
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box display="flex" alignItems="center" gap={1} flex={1}>
                          <Typography fontWeight={600}>{cat}</Typography>
                          <Chip label={`${groups.length} alt grup`} size="small" sx={{ fontSize: 11 }} />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        {groups.length === 0 ? (
                          <Typography variant="body2" color="text.secondary" mb={1}>Henüz alt kategori eklenmemiş</Typography>
                        ) : (
                          groups.map((group, gi) => (
                            <Box key={gi} sx={{ mb: 1.5, p: 1.5, bgcolor: '#fafafa', borderRadius: 2, border: '1px solid #eee' }}>
                              <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                                <Typography variant="subtitle2" fontWeight={600}>{group.title}</Typography>
                                <Box>
                                  <IconButton size="small" onClick={() => openEditSubGroup(cat, gi)}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton size="small" color="error" onClick={() => handleDeleteSubGroup(cat, gi)}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>
                              <Box display="flex" flexWrap="wrap" gap={0.5}>
                                {group.items.map((item, ii) => (
                                  <Chip
                                    key={ii}
                                    label={item}
                                    size="small"
                                    variant="outlined"
                                    onDelete={() => handleDeleteSubItem(cat, gi, ii)}
                                    sx={{ fontSize: 12 }}
                                  />
                                ))}
                                {group.items.length === 0 && (
                                  <Typography variant="caption" color="text.secondary">Kalem yok</Typography>
                                )}
                              </Box>
                            </Box>
                          ))
                        )}
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => openAddSubGroup(cat)}
                          sx={{ mt: 0.5 }}
                        >
                          Alt Grup Ekle
                        </Button>
                      </AccordionDetails>
                    </Accordion>
                  );
                })
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Category Commission Rates */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <PercentIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>Kategori Bazlı Komisyon Oranları</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Typography variant="body2" color="text.secondary" mb={2}>
                Her kategori için özel komisyon oranı belirleyin. Boş bırakılan kategoriler varsayılan oranı (<strong>%{defaultCommission}</strong>) kullanır.
              </Typography>

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 500 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Kategori</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, width: 160 }}>Komisyon (%)</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, width: 140 }}>Uygulanacak</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categories.map((cat) => {
                      const custom = categoryCommissions[cat];
                      const effective = getEffectiveCommission(cat);
                      const isCustom = custom !== undefined && custom > 0;
                      return (
                        <TableRow key={cat} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>{cat}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              size="small"
                              type="number"
                              value={custom !== undefined && custom > 0 ? custom : ''}
                              onChange={(e) => handleCommissionChange(cat, e.target.value)}
                              placeholder={defaultCommission}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                              }}
                              inputProps={{ min: 0, max: 100, step: 0.5 }}
                              sx={{ width: 120 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`%${effective}`}
                              size="small"
                              color={isCustom ? 'primary' : 'default'}
                              variant={isCustom ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {categories.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          <Typography color="text.secondary" py={2}>Kategori bulunamadı</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveSettings} disabled={saving}>
                  {saving ? 'Kaydediliyor...' : 'Komisyon Oranlarını Kaydet'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Info Card */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, bgcolor: '#f5f5f5' }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>Platform Bilgileri</Typography>
              <Grid container spacing={2}>
                {[
                  { label: 'Versiyon', value: '1.0.0' },
                  { label: 'Node.js', value: '20.x' },
                  { label: 'Veritabanı', value: 'PostgreSQL (Supabase)' },
                  { label: 'Cache', value: 'Redis' },
                  { label: 'Arama', value: 'Elasticsearch' },
                  { label: 'Framework', value: 'NestJS + React' },
                ].map((item) => (
                  <Grid item xs={6} md={4} key={item.label}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                      <Typography variant="body2" fontWeight={500}>{item.value}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Subcategory Add/Edit Dialog */}
      <Dialog open={subDialog.open} onClose={() => setSubDialog((s) => ({ ...s, open: false }))} maxWidth="sm" fullWidth>
        <DialogTitle>
          {subDialog.groupIndex !== null ? 'Alt Grubu Düzenle' : 'Yeni Alt Grup Ekle'} — {subDialog.category}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Grup Adı"
            fullWidth
            value={subDialog.title}
            onChange={(e) => setSubDialog((s) => ({ ...s, title: e.target.value }))}
            sx={{ mt: 1, mb: 2 }}
            placeholder="ör: Giyim, Elektronik, Mobilya"
          />
          <TextField
            label="Kalemler (virgülle ayırın)"
            fullWidth
            multiline
            rows={3}
            value={subDialog.items}
            onChange={(e) => setSubDialog((s) => ({ ...s, items: e.target.value }))}
            placeholder="ör: Tişört, Gömlek, Pantolon, Ceket"
            helperText="Her kalemi virgülle ayırarak yazın"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubDialog((s) => ({ ...s, open: false }))}>İptal</Button>
          <Button variant="contained" onClick={handleSaveSubGroup} disabled={!subDialog.title.trim()}>
            {subDialog.groupIndex !== null ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
