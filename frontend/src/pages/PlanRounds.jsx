import { useEffect, useState } from 'react';
import {
  Box, Container, Typography, Paper, Grid, TextField, Button, Chip, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton,
  Tooltip, LinearProgress,
} from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';
import LoginIcon from '@mui/icons-material/Login';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import Header from '../components/Header';
import api from '../services/api';

// Gestão de rodadas — NÃO usa o seletor global de semestre. Cada rodada
// carrega seu próprio semestre-base (snapshot da abertura).
const PlanRounds = () => {
  const navigate = useNavigate();

  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period1, setPeriod1] = useState('');
  const [period2, setPeriod2] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchRounds = () => {
    setLoading(true);
    api.get('/rounds')
      .then(res => setRounds(res.data || []))
      .catch(() => toast.error('Erro ao carregar as rodadas.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRounds(); }, []);

  const handleOpen = async () => {
    if (!period1.trim() || !period2.trim()) {
      toast.error('Informe os dois períodos.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/rounds', { period1: period1.trim(), period2: period2.trim() });
      setPeriod1('');
      setPeriod2('');
      toast.success('Rodada aberta!');
      fetchRounds();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao abrir a rodada.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async (id) => {
    if (!window.confirm('Encerrar a rodada? Ela ficará somente leitura até ser reaberta.')) return;
    try {
      await api.put(`/rounds/${id}/close`);
      toast.success('Rodada encerrada.');
      fetchRounds();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao encerrar a rodada.');
    }
  };

  const handleReopen = async (id) => {
    try {
      await api.put(`/rounds/${id}/reopen`);
      toast.success('Rodada reaberta.');
      fetchRounds();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao reabrir a rodada.');
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
            Abra a rodada de cadastro dos próximos dois períodos. O grupo de alunos é fixado no semestre
            corrente da abertura.
          </Typography>
        </Box>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <LockOpenIcon color="success" />
            <Typography variant="h6" fontWeight="bold">Abrir nova rodada</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Período 1 (ex.: 2026/1)"
                value={period1} onChange={(e) => setPeriod1(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Período 2 (ex.: 2026/2)"
                value={period2} onChange={(e) => setPeriod2(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button fullWidth variant="contained" startIcon={<LockOpenIcon />}
                onClick={handleOpen} disabled={saving}>
                {saving ? 'Abrindo...' : 'Abrir rodada'}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Rodadas</Typography>
          <Divider sx={{ mb: 2 }} />

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><b>Semestre-base</b></TableCell>
                  <TableCell><b>Período 1</b></TableCell>
                  <TableCell><b>Período 2</b></TableCell>
                  <TableCell align="center"><b>Situação</b></TableCell>
                  <TableCell align="center"><b>Ações</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rounds.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      Nenhuma rodada aberta ainda.
                    </TableCell>
                  </TableRow>
                )}
                {rounds.map((r) => (
                  <TableRow key={r.ID} hover>
                    <TableCell>{r.base_semester?.code}</TableCell>
                    <TableCell>{r.period1?.code}</TableCell>
                    <TableCell>{r.period2?.code}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={r.open ? 'Aberta' : 'Encerrada'}
                        color={r.open ? 'success' : 'default'}
                        size="small"
                        icon={r.open ? <LockOpenIcon /> : <LockIcon />}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Entrar na rodada">
                        <IconButton color="primary" onClick={() => navigate(`/planos/${r.ID}`)}>
                          <LoginIcon />
                        </IconButton>
                      </Tooltip>
                      {r.open ? (
                        <Tooltip title="Encerrar">
                          <IconButton color="error" onClick={() => handleClose(r.ID)}>
                            <LockIcon />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Reabrir">
                          <IconButton color="success" onClick={() => handleReopen(r.ID)}>
                            <RestartAltIcon />
                          </IconButton>
                        </Tooltip>
                      )}
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
