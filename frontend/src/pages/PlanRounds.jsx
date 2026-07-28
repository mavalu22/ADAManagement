import { useEffect, useState, useContext } from 'react';
import {
  Box, Container, Typography, Paper, Grid, TextField, Button, Chip, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton,
  Tooltip, Alert, LinearProgress,
} from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import Header from '../components/Header';
import api from '../services/api';
import { SemesterContext } from '../context/SemesterContext';

const PlanRounds = () => {
  const navigate = useNavigate();
  const { selectedSemester, selectedSemesterCode } = useContext(SemesterContext);

  const [round, setRound] = useState(null);
  const [loadingRound, setLoadingRound] = useState(true);
  const [period1, setPeriod1] = useState('');
  const [period2, setPeriod2] = useState('');
  const [saving, setSaving] = useState(false);

  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const fetchRound = async () => {
    setLoadingRound(true);
    try {
      const res = await api.get('/rounds/current');
      setRound(res.data);
    } catch (err) {
      if (err.response?.status !== 404) toast.error('Erro ao carregar a rodada.');
      setRound(null);
    } finally {
      setLoadingRound(false);
    }
  };

  useEffect(() => { fetchRound(); }, []);

  useEffect(() => {
    if (!selectedSemester) return;
    setLoadingStudents(true);
    Promise.all([
      api.get(`/reports/records?semester_id=${selectedSemester}&status=PAE`),
      api.get(`/reports/records?semester_id=${selectedSemester}&status=PIC`),
    ])
      .then(([pae, pic]) => {
        const merged = [...(pae.data || []), ...(pic.data || [])]
          .map(r => ({
            registration: r.student?.registration,
            name: r.student?.name,
            status: r.status,
          }))
          .filter(s => s.registration);
        setStudents(merged);
      })
      .catch(() => toast.error('Erro ao carregar alunos em PAE/PIC.'))
      .finally(() => setLoadingStudents(false));
  }, [selectedSemester]);

  const handleOpen = async () => {
    if (!period1.trim() || !period2.trim()) {
      toast.error('Informe os dois períodos.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/rounds', { period1: period1.trim(), period2: period2.trim() });
      setRound(res.data);
      setPeriod1('');
      setPeriod2('');
      toast.success('Rodada aberta!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao abrir a rodada.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async () => {
    if (!round) return;
    if (!window.confirm('Encerrar a rodada? Os alunos não poderão mais registrar/editar planos.')) return;
    try {
      await api.put(`/rounds/${round.ID}/close`);
      toast.success('Rodada encerrada.');
      fetchRound();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao encerrar a rodada.');
    }
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            Planos de Integralização
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Abra a rodada de cadastro dos próximos dois períodos e acompanhe os alunos em PAE/PIC.
          </Typography>
        </Box>

        <Paper sx={{ p: 3, mb: 3 }}>
          {loadingRound ? (
            <LinearProgress />
          ) : round && round.open ? (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LockOpenIcon color="success" />
                <Typography variant="h6" fontWeight="bold">Rodada aberta</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary">Períodos-alvo:</Typography>
                <Chip label={`Período 1 · ${round.period1.code}`} color="primary" variant="outlined" />
                <Chip label={`Período 2 · ${round.period2.code}`} color="primary" variant="outlined" />
                <Button
                  variant="outlined" color="error" size="small" startIcon={<LockIcon />}
                  onClick={handleClose} sx={{ ml: 'auto' }}
                >
                  Encerrar rodada
                </Button>
              </Box>
            </Box>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LockIcon color="disabled" />
                <Typography variant="h6" fontWeight="bold">Abrir nova rodada</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth size="small" label="Período 1 (ex.: 2026/1)"
                    value={period1} onChange={(e) => setPeriod1(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth size="small" label="Período 2 (ex.: 2026/2)"
                    value={period2} onChange={(e) => setPeriod2(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    fullWidth variant="contained" startIcon={<LockOpenIcon />}
                    onClick={handleOpen} disabled={saving}
                  >
                    {saving ? 'Abrindo...' : 'Abrir rodada'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Alunos em PAE/PIC — {selectedSemesterCode}
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {!round?.open && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Abra uma rodada para que os alunos possam registrar os planos. Você também pode registrar em nome deles.
            </Alert>
          )}

          {loadingStudents && <LinearProgress sx={{ mb: 2 }} />}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><b>Matrícula</b></TableCell>
                  <TableCell><b>Nome</b></TableCell>
                  <TableCell><b>Enquadramento</b></TableCell>
                  <TableCell align="center"><b>Plano</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.length === 0 && !loadingStudents && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      Nenhum aluno em PAE/PIC neste semestre.
                    </TableCell>
                  </TableRow>
                )}
                {students.map((s) => (
                  <TableRow key={s.registration} hover>
                    <TableCell>{s.registration}</TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell><Chip label={s.status} color="warning" size="small" /></TableCell>
                    <TableCell align="center">
                      <Tooltip title={round?.open ? 'Ver/editar plano' : 'Abra uma rodada para editar'}>
                        <span>
                          <IconButton
                            color="primary"
                            disabled={!round?.open}
                            onClick={() => navigate(`/planos/${s.registration}`)}
                          >
                            <EditNoteIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

      </Container>
    </Box>
  );
};

export default PlanRounds;
