import React, { useEffect, useState, useContext } from 'react';
import {
  Box, Container, Paper, Typography, Button, IconButton, Tooltip,
  Chip, Divider, LinearProgress, Select, MenuItem, FormControl,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import Header from '../components/Header';
import api from '../services/api';
import { SemesterContext } from '../context/SemesterContext';

const StudyPlan = () => {
  const { registration } = useParams();
  const [searchParams] = useSearchParams();
  const semesterId = searchParams.get('semester_id');
  const status = searchParams.get('status');
  const navigate = useNavigate();
  const { selectedSemesterCode } = useContext(SemesterContext);

  const [studentName, setStudentName] = useState('');
  const [allDisciplines, setAllDisciplines] = useState([]);
  const [rows, setRows] = useState([]);
  const [addingId, setAddingId] = useState('');
  const [existingPlan, setExistingPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const pageTitle =
    status === 'PIC'
      ? 'Plano de integralização curricular - PIC'
      : status === 'PAE'
      ? 'Plano de integralização curricular - PAE'
      : 'Plano de integralização curricular';

  const statusColor = status === 'PAE' || status === 'PIC' ? 'warning' : 'default';

  const availableDisciplines = allDisciplines.filter(d => !rows.find(r => r.ID === d.ID));

  useEffect(() => {
    if (!semesterId) return;

    api.get(`/students/${registration}/history`)
      .then(res => {
        if (res.data?.student) setStudentName(res.data.student.name || registration);
      })
      .catch(() => setStudentName(registration));

    Promise.all([
      api.get('/disciplines'),
      api.get(`/students/${registration}/plan?semester_id=${semesterId}`).catch(err => {
        if (err.response?.status === 404) return { data: null };
        throw err;
      }),
    ])
      .then(([disciplinesRes, planRes]) => {
        setAllDisciplines(disciplinesRes.data || []);
        if (planRes.data) {
          setExistingPlan(planRes.data);
          setRows(planRes.data.disciplines || []);
        }
      })
      .catch(() => toast.error('Erro ao carregar dados do plano.'))
      .finally(() => setLoading(false));
  }, [registration, semesterId]);

  const handleAddRow = () => {
    if (!addingId) return;
    const discipline = allDisciplines.find(d => d.ID === addingId);
    if (!discipline) return;
    setRows(prev => [...prev, discipline]);
    setAddingId('');
  };

  const handleRemoveRow = (id) => {
    setRows(prev => prev.filter(r => r.ID !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    const body = {
      semester_id: Number(semesterId),
      discipline_ids: rows.map(r => r.ID),
    };
    try {
      if (existingPlan) {
        await api.put(`/students/${registration}/plan`, body);
        toast.success('Plano atualizado com sucesso!');
      } else {
        const res = await api.post(`/students/${registration}/plan`, body);
        setExistingPlan(res.data);
        toast.success('Plano registrado com sucesso!');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar plano.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Container maxWidth="md" sx={{ mt: 4 }}>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Voltar">
              <IconButton onClick={() => navigate(-1)}>
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
            <Box>
              <Typography variant="h5" color="primary" fontWeight="bold">
                {pageTitle}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Semestre: {selectedSemesterCode} &nbsp;|&nbsp; Matrícula: {registration}
                {studentName && ` — ${studentName}`}
              </Typography>
            </Box>
            {status && (
              <Chip label={status} color={statusColor} size="small" sx={{ ml: 'auto' }} />
            )}
          </Box>
        </Paper>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {!loading && (
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" fontWeight="bold">
                Disciplinas Planejadas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {rows.length} {rows.length === 1 ? 'disciplina' : 'disciplinas'}
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 160, fontWeight: 700 }}>Código</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Disciplina</TableCell>
                    <TableCell sx={{ width: 56 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 && (
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
                          <IconButton size="small" color="error" onClick={() => handleRemoveRow(d.ID)}>
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
                            <MenuItem key={d.ID} value={d.ID}>
                              {d.code} — {d.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell align="center" sx={{ pt: 1.5, pb: 1 }}>
                      <Tooltip title="Adicionar">
                        <span>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={handleAddRow}
                            disabled={!addingId}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Salvando...' : existingPlan ? 'Atualizar Plano' : 'Registrar Plano'}
              </Button>
            </Box>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default StudyPlan;
