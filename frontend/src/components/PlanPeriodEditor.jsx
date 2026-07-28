import { useEffect, useState } from 'react';
import {
  Paper, Box, Typography, Divider, IconButton, Tooltip, Button,
  Select, MenuItem, FormControl, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import { toast } from 'react-toastify';
import api from '../services/api';

// Editor do plano de um único período (semestre). Reutilizado pela área do
// aluno e pela área do coordenador. Carrega e salva o plano de
// (registration, semesterId) pelos endpoints existentes de plano.
const PlanPeriodEditor = ({ registration, semesterId, semesterCode, label, allDisciplines }) => {
  const [rows, setRows] = useState([]);
  const [addingId, setAddingId] = useState('');
  const [existingPlan, setExistingPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const availableDisciplines = allDisciplines.filter(d => !rows.find(r => r.ID === d.ID));

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get(`/students/${registration}/plan?semester_id=${semesterId}`)
      .then(res => {
        if (!active) return;
        setExistingPlan(res.data);
        setRows(res.data.disciplines || []);
      })
      .catch(err => {
        if (!active) return;
        if (err.response?.status !== 404) {
          toast.error('Erro ao carregar o plano deste período.');
        }
        setExistingPlan(null);
        setRows([]);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [registration, semesterId]);

  const handleAdd = () => {
    if (!addingId) return;
    const discipline = allDisciplines.find(d => d.ID === addingId);
    if (discipline) setRows(prev => [...prev, discipline]);
    setAddingId('');
  };

  const handleRemove = (id) => setRows(prev => prev.filter(r => r.ID !== id));

  const handleSave = async () => {
    setSaving(true);
    const body = { semester_id: Number(semesterId), discipline_ids: rows.map(r => r.ID) };
    try {
      if (existingPlan) {
        const res = await api.put(`/students/${registration}/plan`, body);
        setExistingPlan(res.data);
      } else {
        const res = await api.post(`/students/${registration}/plan`, body);
        setExistingPlan(res.data);
      }
      toast.success(`Plano de ${semesterCode} salvo!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar o plano.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight="bold">{label}</Typography>
          <Typography variant="body2" color="text.secondary">Semestre {semesterCode}</Typography>
        </Box>
        <Chip label={`${rows.length} ${rows.length === 1 ? 'disciplina' : 'disciplinas'}`} size="small" />
      </Box>
      <Divider sx={{ mb: 2 }} />

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 140, fontWeight: 700 }}>Código</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Disciplina</TableCell>
              <TableCell sx={{ width: 48 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  Nenhuma disciplina adicionada.
                </TableCell>
              </TableRow>
            )}
            {rows.map(d => (
              <TableRow key={d.ID} hover>
                <TableCell>{d.code}</TableCell>
                <TableCell>{d.name}</TableCell>
                <TableCell align="center">
                  <Tooltip title="Remover">
                    <IconButton size="small" color="error" onClick={() => handleRemove(d.ID)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}

            <TableRow>
              <TableCell colSpan={2} sx={{ pt: 1.5, pb: 1 }}>
                <FormControl fullWidth size="small">
                  <Select
                    value={addingId}
                    onChange={e => setAddingId(e.target.value)}
                    displayEmpty
                    disabled={availableDisciplines.length === 0}
                  >
                    <MenuItem value="" disabled>
                      {availableDisciplines.length === 0
                        ? 'Todas as disciplinas já adicionadas'
                        : 'Selecione uma disciplina...'}
                    </MenuItem>
                    {availableDisciplines.map(d => (
                      <MenuItem key={d.ID} value={d.ID}>{d.code} — {d.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </TableCell>
              <TableCell align="center" sx={{ pt: 1.5, pb: 1 }}>
                <Tooltip title="Adicionar">
                  <span>
                    <IconButton size="small" color="primary" onClick={handleAdd} disabled={!addingId}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving || loading}>
          {saving ? 'Salvando...' : existingPlan ? 'Atualizar' : 'Registrar'}
        </Button>
      </Box>
    </Paper>
  );
};

export default PlanPeriodEditor;
