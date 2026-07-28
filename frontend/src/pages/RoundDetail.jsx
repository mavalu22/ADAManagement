import { useEffect, useState } from 'react';
import {
  Box, Container, Paper, Typography, Chip, Divider, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, LinearProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditNoteIcon from '@mui/icons-material/EditNote';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import Header from '../components/Header';
import api from '../services/api';

// Detalhe de uma rodada: cabeçalho + alunos do semestre-base (PAE/PIC).
// A lista vem do snapshot da rodada, independente do seletor global.
const RoundDetail = () => {
  const { roundId } = useParams();
  const navigate = useNavigate();

  const [round, setRound] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/rounds/students?round_id=${roundId}`)
      .then(res => {
        setRound(res.data.round);
        setStudents(res.data.students || []);
      })
      .catch(() => toast.error('Erro ao carregar a rodada.'))
      .finally(() => setLoading(false));
  }, [roundId]);

  if (loading) return <LinearProgress />;
  if (!round) return <Typography sx={{ p: 4 }}>Rodada não encontrada.</Typography>;

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Tooltip title="Voltar">
              <IconButton onClick={() => navigate('/planos')}><ArrowBackIcon /></IconButton>
            </Tooltip>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" fontWeight="bold" color="primary">
                Rodada — base {round.base_semester?.code}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Períodos: {round.period1?.code} e {round.period2?.code}
              </Typography>
            </Box>
            <Chip
              label={round.open ? 'Aberta' : 'Encerrada'}
              color={round.open ? 'success' : 'default'}
              icon={round.open ? <LockOpenIcon /> : <LockIcon />}
            />
          </Box>
        </Paper>

        {!round.open && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Rodada encerrada — os planos ficam somente leitura. Reabra a rodada na tela anterior para editar.
          </Alert>
        )}

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Alunos em PAE/PIC ({round.base_semester?.code})
          </Typography>
          <Divider sx={{ mb: 2 }} />

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
                {students.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      Nenhum aluno em PAE/PIC no semestre-base desta rodada.
                    </TableCell>
                  </TableRow>
                )}
                {students.map((s) => (
                  <TableRow key={s.registration} hover>
                    <TableCell>{s.registration}</TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell><Chip label={s.status} color="warning" size="small" /></TableCell>
                    <TableCell align="center">
                      <Tooltip title={round.open ? 'Editar plano' : 'Ver plano'}>
                        <IconButton color="primary" onClick={() => navigate(`/planos/${roundId}/${s.registration}`)}>
                          {round.open ? <EditNoteIcon /> : <VisibilityIcon />}
                        </IconButton>
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

export default RoundDetail;
