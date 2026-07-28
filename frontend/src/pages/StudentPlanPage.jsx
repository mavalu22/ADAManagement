import { useEffect, useState } from 'react';
import {
  Box, Container, Typography, Grid, Chip, Alert, LinearProgress, Paper,
} from '@mui/material';
import StudentHeader from '../components/StudentHeader';
import PlanPeriodEditor from '../components/PlanPeriodEditor';
import api from '../services/api';

const isEligible = (status) => status === 'PAE' || status === 'PIC';

const StudentPlanPage = () => {
  const [me, setMe] = useState(null);
  const [round, setRound] = useState(null);
  const [disciplines, setDisciplines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, disciplinesRes] = await Promise.all([
          api.get('/me'),
          api.get('/disciplines'),
        ]);
        setMe(meRes.data);
        setDisciplines(disciplinesRes.data || []);

        // A rodada aberta pode não existir (404) — não é erro.
        try {
          const roundRes = await api.get('/rounds/current');
          setRound(roundRes.data);
        } catch (err) {
          if (err.response?.status !== 404) throw err;
          setRound(null);
        }
      } catch {
        // erros são tratados na renderização (me nulo)
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LinearProgress />;
  if (!me) return <Typography sx={{ p: 4 }}>Não foi possível carregar seus dados.</Typography>;

  const eligible = isEligible(me.status);

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <StudentHeader />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="h5" fontWeight={700} color="text.primary">
                Olá, {me.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Matrícula {me.registration}{me.course?.name ? ` · ${me.course.name}` : ''}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" color="text.secondary" display="block">Seu enquadramento</Typography>
              <Chip
                label={me.status || 'Sem enquadramento'}
                color={eligible ? 'warning' : 'default'}
              />
            </Box>
          </Box>
        </Paper>

        <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
          Plano de Integralização Curricular
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Selecione as disciplinas que pretende cursar em cada um dos próximos dois períodos.
        </Typography>

        {!eligible && (
          <Alert severity="info">
            O plano de integralização é destinado a alunos em acompanhamento (PAE ou PIC). Seu enquadramento
            atual não requer o registro de um plano.
          </Alert>
        )}

        {eligible && !round && (
          <Alert severity="info">
            Não há uma rodada de cadastro de plano aberta no momento. Aguarde a coordenação abrir o período de registro.
          </Alert>
        )}

        {eligible && round && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <PlanPeriodEditor
                registration={me.registration}
                semesterId={round.period1.ID}
                semesterCode={round.period1.code}
                label="Período 1"
                allDisciplines={disciplines}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <PlanPeriodEditor
                registration={me.registration}
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

export default StudentPlanPage;
