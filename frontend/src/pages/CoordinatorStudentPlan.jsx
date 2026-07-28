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

// Página da coordenação para registrar/editar o plano de um aluno dentro de
// uma rodada específica (fallback). Editável apenas se a rodada estiver aberta.
const CoordinatorStudentPlan = () => {
  const { roundId, registration } = useParams();
  const navigate = useNavigate();

  const [round, setRound] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [status, setStatus] = useState('');
  const [disciplines, setDisciplines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [cohortRes, disciplinesRes] = await Promise.all([
          api.get(`/rounds/students?round_id=${roundId}`),
          api.get('/disciplines'),
        ]);
        setRound(cohortRes.data.round);
        setDisciplines(disciplinesRes.data || []);
        const student = (cohortRes.data.students || []).find(s => s.registration === registration);
        setStudentName(student?.name || registration);
        setStatus(student?.status || '');
      } catch {
        toast.error('Erro ao carregar os dados do plano.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [roundId, registration]);

  if (loading) return <LinearProgress />;
  if (!round) return <Typography sx={{ p: 4 }}>Rodada não encontrada.</Typography>;

  const readOnly = !round.open;

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Tooltip title="Voltar">
              <IconButton onClick={() => navigate(`/planos/${roundId}`)}><ArrowBackIcon /></IconButton>
            </Tooltip>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" fontWeight="bold" color="primary">
                Plano — {studentName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Matrícula {registration} · rodada base {round.base_semester?.code}
              </Typography>
            </Box>
            {status && <Chip label={status} color="warning" />}
          </Box>
        </Paper>

        {readOnly && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Rodada encerrada — somente leitura. Reabra a rodada para editar.
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <PlanPeriodEditor
              registration={registration}
              semesterId={round.period1.ID}
              semesterCode={round.period1.code}
              label="Período 1"
              allDisciplines={disciplines}
              readOnly={readOnly}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <PlanPeriodEditor
              registration={registration}
              semesterId={round.period2.ID}
              semesterCode={round.period2.code}
              label="Período 2"
              allDisciplines={disciplines}
              readOnly={readOnly}
            />
          </Grid>
        </Grid>

      </Container>
    </Box>
  );
};

export default CoordinatorStudentPlan;
