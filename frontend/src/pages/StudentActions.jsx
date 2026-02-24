import React, { useEffect, useState, useContext } from 'react';
import {
  Box, Container, Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Grid, TextField, Button,
  Chip, IconButton, Tooltip, LinearProgress, Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import Header from '../components/Header';
import api from '../services/api';
import { SemesterContext } from '../context/SemesterContext';

const TODAY = new Date().toISOString().split('T')[0];

const StudentActions = () => {
  const { registration } = useParams();
  const [searchParams] = useSearchParams();
  const semesterId = searchParams.get('semester_id');
  const navigate = useNavigate();
  const { selectedSemesterCode } = useContext(SemesterContext);

  // Dados do aluno
  const [studentName, setStudentName] = useState('');
  const [studentStatus, setStudentStatus] = useState('');

  // Lista de ações
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Formulário de nova ação / edição
  const [actionDate, setActionDate] = useState(TODAY);
  const [description, setDescription] = useState('');
  const [responseDate, setResponseDate] = useState('');
  const [saving, setSaving] = useState(false);

  // Edição inline
  const [editingId, setEditingId] = useState(null);
  const [editActionDate, setEditActionDate] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editResponseDate, setEditResponseDate] = useState('');

  // Busca dados do aluno e suas ações ao montar
  useEffect(() => {
    if (!semesterId) return;

    // Busca histórico do aluno para obter nome e status
    api.get(`/students/${registration}/history`)
       .then(res => {
         const data = res.data;
         if (data?.student) {
           setStudentName(data.student.name || registration);
         }
         // Pega o status do semestre selecionado
         if (data?.records) {
           const record = data.records.find(r => String(r.semester_id) === String(semesterId));
           if (record) setStudentStatus(record.status);
         }
       })
       .catch(() => setStudentName(registration));

    fetchActions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registration, semesterId]);

  const fetchActions = () => {
    setLoading(true);
    api.get(`/students/${registration}/actions?semester_id=${semesterId}`)
       .then(res => setActions(res.data || []))
       .catch(err => console.error(err))
       .finally(() => setLoading(false));
  };

  const handleSave = async () => {
    if (!description.trim()) {
      toast.error('A descrição é obrigatória.');
      return;
    }
    if (!actionDate) {
      toast.error('A data da ação é obrigatória.');
      return;
    }

    setSaving(true);
    try {
      const body = {
        semester_id: Number(semesterId),
        action_date: new Date(actionDate).toISOString(),
        description: description.trim(),
        response_date: responseDate ? new Date(responseDate).toISOString() : null,
      };
      await api.post(`/students/${registration}/actions`, body);
      toast.success('Ação registrada com sucesso!');
      // Limpa formulário e recarrega
      setActionDate(TODAY);
      setDescription('');
      setResponseDate('');
      fetchActions();
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro ao registrar ação.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (action) => {
    setEditingId(action.ID);
    setEditActionDate(action.action_date ? action.action_date.split('T')[0] : '');
    setEditDescription(action.description || '');
    setEditResponseDate(action.response_date ? action.response_date.split('T')[0] : '');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdate = async (id) => {
    if (!editDescription.trim()) {
      toast.error('A descrição é obrigatória.');
      return;
    }

    try {
      const body = {
        action_date: editActionDate ? new Date(editActionDate).toISOString() : undefined,
        description: editDescription.trim(),
        response_date: editResponseDate ? new Date(editResponseDate).toISOString() : null,
      };
      await api.put(`/actions/${id}`, body);
      toast.success('Ação atualizada com sucesso!');
      setEditingId(null);
      fetchActions();
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro ao atualizar ação.';
      toast.error(msg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja remover esta ação?')) return;
    try {
      await api.delete(`/actions/${id}`);
      toast.success('Ação removida.');
      fetchActions();
    } catch (err) {
      toast.error('Erro ao remover ação.');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const statusColor = (s) => {
    if (s === 'Em regularidade') return 'success';
    if (s === 'PAE' || s === 'PIC') return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4 }}>

        {/* Cabeçalho da página */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Tooltip title="Voltar ao Relatório Acadêmico">
              <IconButton onClick={() => navigate(`/report/records?semester_id=${semesterId}`)}>
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
            <Box>
              <Typography variant="h5" color="primary" fontWeight="bold">
                Ações – {studentName || registration}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Semestre: {selectedSemesterCode} &nbsp;|&nbsp; Matrícula: {registration}
              </Typography>
            </Box>
            {studentStatus && (
              <Chip
                label={studentStatus}
                color={statusColor(studentStatus)}
                size="small"
                sx={{ ml: 'auto' }}
              />
            )}
          </Box>
        </Paper>

        {/* Formulário de nova ação */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Registrar Nova Ação
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth label="Data da Ação" type="date"
                value={actionDate}
                onChange={(e) => setActionDate(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth label="Data de Resposta do Aluno (opcional)" type="date"
                value={responseDate}
                onChange={(e) => setResponseDate(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth multiline rows={4}
                label="Descrição da Ação"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                inputProps={{ maxLength: 500 }}
                helperText={`${description.length}/500`}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar Ação'}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Lista de ações registradas */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Ações Registradas
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          <TableContainer>
            <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '130px' }}><b>Data da Ação</b></TableCell>
                  <TableCell><b>Descrição</b></TableCell>
                  <TableCell sx={{ width: '160px' }}><b>Resposta do Aluno</b></TableCell>
                  <TableCell align="center" sx={{ width: '100px' }}><b>Ações</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {actions.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      Nenhuma ação registrada para este aluno neste semestre.
                    </TableCell>
                  </TableRow>
                )}
                {actions.map((action) => (
                  editingId === action.ID ? (
                    /* Linha em modo de edição — formulário full-width */
                    <TableRow key={action.ID} sx={{ bgcolor: 'action.hover' }}>
                      <TableCell colSpan={4} sx={{ py: 2, px: 3 }}>
                        <Grid container spacing={2} alignItems="flex-start">
                          <Grid item xs={12} sm={3}>
                            <TextField
                              fullWidth type="date" size="small" label="Data da Ação"
                              value={editActionDate}
                              onChange={(e) => setEditActionDate(e.target.value)}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <TextField
                              fullWidth type="date" size="small" label="Resposta do Aluno"
                              value={editResponseDate}
                              onChange={(e) => setEditResponseDate(e.target.value)}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth multiline rows={3} size="small" label="Descrição"
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              inputProps={{ maxLength: 500 }}
                              helperText={`${editDescription.length}/500`}
                            />
                          </Grid>
                          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Button
                              variant="outlined" size="small"
                              startIcon={<CancelIcon />}
                              onClick={cancelEdit}
                            >
                              Cancelar
                            </Button>
                            <Button
                              variant="contained" size="small"
                              startIcon={<SaveIcon />}
                              onClick={() => handleUpdate(action.ID)}
                            >
                              Salvar
                            </Button>
                          </Grid>
                        </Grid>
                      </TableCell>
                    </TableRow>
                  ) : (
                    /* Linha em modo de visualização */
                    <TableRow key={action.ID} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {formatDate(action.action_date)}
                      </TableCell>
                      <TableCell sx={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>
                        {action.description}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {formatDate(action.response_date)}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar">
                          <IconButton color="primary" onClick={() => startEdit(action)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remover">
                          <IconButton color="error" onClick={() => handleDelete(action.ID)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  )
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

      </Container>
    </Box>
  );
};

export default StudentActions;
