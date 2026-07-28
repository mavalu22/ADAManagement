import { useEffect, useState } from 'react';
import {
  Box, Container, Paper, Typography, Grid, Chip, IconButton, Tooltip,
  Alert, LinearProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import Header from '../components/Header';
import PlanPeriodEditor from '../components/PlanPeriodEditor';
import api from '../services/api';

// Página da coordenação para registrar/editar o plano de um aluno (fallback).
// Reusa os mesmos editores de período da área do aluno.
const CoordinatorStudentPlan = () => {
  const { registration } = useParams();
  const navigate = useNavigate();

  const [studentName, setStudentName] = useState('');
  const [status, setStatus] = useState('');
  const [round, setRound] = useState(null);
  const [disciplines, setDisciplines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [historyRes, disciplinesRes] = await Promise.all([
          api.get(`/students/${registration}/history`),
          api.get('/disciplines'),
        ]);
        setStudentName(historyRes.data?.student?.name || registration);
        const history = historyRes.data?.history || [];
        // Histórico vem ordenado por semestre asc; o último é o mais recente.
        setStatus(history.length ? history[history.length - 1].status : '');
        setDisciplines(disciplinesRes.data || []);

        try {
          const roundRes = await api.get('/rounds/current');
          setRound(roundRes.data);
        } catch (err) {
          if (err.response?.status !== 404) throw err;
          setRound(null);
        }
      } catch {
        toast.error('Erro ao carregar os dados do aluno.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [registration]);

  if (loading) return <LinearProgress />;

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Voltar">
              <IconButton onClick={() => navigate('/planos')}>
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" fontWeight="bold" color="primary">
                Plano de Integralização — {studentName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Matrícula {registration}
              </Typography>
            </Box>
            {status && <Chip label={status} color={status === 'PAE' || status === 'PIC' ? 'warning' : 'default'} />}
          </Box>
        </Paper>

        {!round?.open ? (
          <Alert severity="info">
            Não há rodada de cadastro aberta. Abra uma rodada na página de Planos de Integralização para editar.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <PlanPeriodEditor
                registration={registration}
                semesterId={round.period1.ID}
                semesterCode={round.period1.code}
                label="Período 1"
                allDisciplines={disciplines}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <PlanPeriodEditor
                registration={registration}
                semesterId={round.period2.ID}
                semesterCode={round.period2.code}
                label="Período 2"
                allDisciplines={disciplines}
              />
            </Grid>
          </Grid>
        )}

      </Container>
    </Box>
  );
};

export default CoordinatorStudentPlan;
