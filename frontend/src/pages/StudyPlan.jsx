import React, { useEffect, useState, useContext } from 'react';
import {
  Box, Container, Paper, Typography, Button, IconButton, Tooltip,
  Chip, Divider, LinearProgress, Checkbox, FormControlLabel,
  FormGroup, Grid
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
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
  const [selectedIds, setSelectedIds] = useState(new Set());
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
          const ids = new Set((planRes.data.disciplines || []).map(d => d.ID));
          setSelectedIds(ids);
        }
      })
      .catch(() => toast.error('Erro ao carregar dados do plano.'))
      .finally(() => setLoading(false));
  }, [registration, semesterId]);

  const toggleDiscipline = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const body = {
      semester_id: Number(semesterId),
      discipline_ids: Array.from(selectedIds),
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Tooltip title="Voltar ao Relatório Acadêmico">
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
                {selectedIds.size} selecionada{selectedIds.size !== 1 ? 's' : ''}
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {allDisciplines.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                Nenhuma disciplina cadastrada. Acesse a tela de Disciplinas para cadastrar.
              </Typography>
            ) : (
              <FormGroup>
                <Grid container spacing={1}>
                  {allDisciplines.map(d => (
                    <Grid item xs={12} sm={6} key={d.ID}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedIds.has(d.ID)}
                            onChange={() => toggleDiscipline(d.ID)}
                            size="small"
                          />
                        }
                        label={
                          <Typography variant="body2">
                            <b>{d.code}</b> — {d.name}
                          </Typography>
                        }
                      />
                    </Grid>
                  ))}
                </Grid>
              </FormGroup>
            )}

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
