import { useEffect, useState } from 'react';
import {
  Box, Container, Typography, Grid, Chip, Alert, LinearProgress, Paper, Divider,
  List, ListItem, ListItemText,
} from '@mui/material';
import StudentHeader from '../components/StudentHeader';
import PlanPeriodEditor from '../components/PlanPeriodEditor';
import api from '../services/api';

const isEligible = (status) => status === 'PAE' || status === 'PIC';

// Lista somente-leitura das disciplinas de um período (rodadas encerradas).
const ReadOnlyPeriod = ({ label, semesterCode, disciplines }) => (
  <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
    <Typography variant="subtitle1" fontWeight="bold">{label}</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Semestre {semesterCode}</Typography>
    <Divider sx={{ mb: 1 }} />
    {(!disciplines || disciplines.length === 0) ? (
      <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>Nenhuma disciplina registrada.</Typography>
    ) : (
      <List dense disablePadding>
        {disciplines.map(d => (
          <ListItem key={d.ID} disableGutters>
            <ListItemText primary={d.name} secondary={d.code} />
          </ListItem>
        ))}
      </List>
    )}
  </Paper>
);

const StudentPlanPage = () => {
  const [me, setMe] = useState(null);
  const [entries, setEntries] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const meRes = await api.get('/me');
        setMe(meRes.data);

        const [roundsRes, disciplinesRes] = await Promise.all([
          api.get(`/students/${meRes.data.registration}/rounds`),
          api.get('/disciplines'),
        ]);
        setEntries(roundsRes.data || []);
        setDisciplines(disciplinesRes.data || []);
      } catch {
        // tratado na renderização (me nulo)
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LinearProgress />;
  if (!me) return <Typography sx={{ p: 4 }}>Não foi possível carregar seus dados.</Typography>;

  const openEntry = entries.find(e => e.round.open);
  const closedEntries = entries.filter(e => !e.round.open);

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <StudentHeader />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="h5" fontWeight={700} color="text.primary">Olá, {me.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                Matrícula {me.registration}{me.course?.name ? ` · ${me.course.name}` : ''}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" color="text.secondary" display="block">Seu enquadramento</Typography>
              <Chip label={me.status || 'Sem enquadramento'} color={isEligible(me.status) ? 'warning' : 'default'} />
            </Box>
          </Box>
        </Paper>

        {/* Rodada aberta — editável */}
        <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>Rodada atual</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Selecione as disciplinas que pretende cursar em cada um dos próximos dois períodos.
        </Typography>

        {!openEntry ? (
          <Alert severity="info" sx={{ mb: 4 }}>
            Não há uma rodada de cadastro aberta para você no momento. Aguarde a coordenação abrir o período de registro.
          </Alert>
        ) : (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <PlanPeriodEditor
                registration={me.registration}
                semesterId={openEntry.round.period1.ID}
                semesterCode={openEntry.round.period1.code}
                label="Período 1"
                allDisciplines={disciplines}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <PlanPeriodEditor
                registration={me.registration}
                semesterId={openEntry.round.period2.ID}
                semesterCode={openEntry.round.period2.code}
                label="Período 2"
                allDisciplines={disciplines}
              />
            </Grid>
          </Grid>
        )}

        {/* Rodadas anteriores — somente leitura */}
        {closedEntries.length > 0 && (
          <>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Planos anteriores</Typography>
            {closedEntries.map((e) => (
              <Paper key={e.round.ID} sx={{ p: 3, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Rodada base {e.round.base_semester?.code}
                  </Typography>
                  <Chip label="Encerrada" size="small" />
                  <Chip label={e.status} color="warning" size="small" variant="outlined" />
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <ReadOnlyPeriod label="Período 1" semesterCode={e.round.period1?.code} disciplines={e.period1_disciplines} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <ReadOnlyPeriod label="Período 2" semesterCode={e.round.period2?.code} disciplines={e.period2_disciplines} />
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </>
        )}

      </Container>
    </Box>
  );
};

export default StudentPlanPage;
