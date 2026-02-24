import { useEffect, useState, useContext } from 'react';
import { 
  Box, Container, Grid, Paper, Typography, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Chip, IconButton, Tooltip, Button, useTheme
} from '@mui/material'; // <--- Adicionado useTheme
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';

// Ícones
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TimelineIcon from '@mui/icons-material/Timeline';
import SchoolIcon from '@mui/icons-material/School'; 
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';

import Header from '../../components/Header';
import api from '../../services/api';
import { SemesterContext } from '../../context/SemesterContext';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

const IndicatorsReport = () => {
  const navigate = useNavigate();
  const theme = useTheme(); // <--- Hook do tema
  const { selectedSemester, selectedSemesterCode } = useContext(SemesterContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedSemester) return;
    setLoading(true);
    
    api.get(`/reports/dashboard?semester_id=${selectedSemester}`)
       .then(res => setData(res.data))
       .catch(err => console.error(err))
       .finally(() => setLoading(false));
  }, [selectedSemester]);

  const handlePieClick = (entry) => {
    navigate(`/reports/records?status=${entry.name}`);
  };

  // Define as cores da scrollbar baseadas no modo atual (sem callback)
  const scrollbarTrack = theme.palette.mode === 'light' ? '#f1f1f1' : '#0F172A';
  const scrollbarThumb = theme.palette.mode === 'light' ? '#c1c1c1' : '#334155';
  const scrollbarThumbHover = theme.palette.mode === 'light' ? '#a8a8a8' : '#475569';

  const scrollStyle = {
    flexGrow: 1,
    overflowY: 'auto', 
    '&::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: scrollbarTrack,
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: scrollbarThumb,
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      backgroundColor: scrollbarThumbHover,
    },
  };

  // Estilo do Tooltip do Recharts para Dark Mode
  const chartTooltipStyle = {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: '8px',
    color: theme.palette.text.primary
  };

  if (loading) return <LinearProgress />;
  if (!data) return <Typography sx={{p:4}}>Selecione um semestre.</Typography>;

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} color="text.primary">
            Painel de Indicadores
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {selectedSemesterCode}
          </Typography>
        </Box>

        <Grid container spacing={3}>
            
            {/* 1. GRÁFICO DE STATUS */}
            <Grid item xs={12} md={5}>
                <Paper sx={{ p: 3, height: 450, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                        Distribuição de Status
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                        Clique em uma fatia para ver detalhes
                    </Typography>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data.status_distribution}
                                cx="50%" cy="50%"
                                innerRadius={70}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                                label
                                onClick={handlePieClick}
                                style={{ cursor: 'pointer' }}
                                stroke={theme.palette.background.paper} // Borda da fatia na cor do fundo
                            >
                                {data.status_distribution.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip contentStyle={chartTooltipStyle} />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                </Paper>
            </Grid>

            {/* 2. ALUNOS CRÍTICOS */}
            <Grid item xs={12} md={7}>
                <Paper sx={{ p: 3, height: 450, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <WarningAmberIcon color="error" />
                            <Typography variant="h6" color="error" fontWeight="bold">
                                Atenção: Alunos em Situação Crítica
                            </Typography>
                        </Box>
                        
                        <Button 
                            variant="outlined" color="error" size="small" endIcon={<VisibilityIcon />}
                            onClick={() => navigate('/reports/records?mode=critical')}
                        >
                            Ver Todos
                        </Button>
                    </Box>
                    
                    <TableContainer sx={scrollStyle}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Matrícula</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Nome</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Semestres s/ CH</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Trancamentos</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Ação</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.critical_students?.map((student) => (
                                    <TableRow key={student.id} hover>
                                        <TableCell>{student.registration}</TableCell>
                                        <TableCell>{student.name}</TableCell>
                                        <TableCell align="center">
                                            {student.no_hours > 1 ? (
                                                <Chip label={student.no_hours} color="error" size="small" variant="outlined" />
                                            ) : student.no_hours}
                                        </TableCell>
                                        <TableCell align="center">
                                            {student.locks > 1 ? (
                                                <Chip label={student.locks} color="error" size="small" />
                                            ) : student.locks}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Ver Histórico">
                                                <IconButton size="small" color="primary" onClick={() => navigate(`/students/${student.registration}`)}>
                                                    <TimelineIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!data.critical_students || data.critical_students.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>Nenhum aluno crítico.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Grid>

            {/* 3. ALUNOS NA RETA FINAL */}
            <Grid item xs={12}>
                <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SchoolIcon color="success" />
                            <Typography variant="h6" color="success.main" fontWeight="bold">
                                Próximos da Formatura (≤ 6 Matérias Pendentes)
                            </Typography>
                        </Box>

                        <Button 
                            variant="outlined" color="success" size="small" endIcon={<VisibilityIcon />}
                            onClick={() => navigate('/reports/records?max_pending=6')}
                        >
                            Ver Relatório Completo
                        </Button>
                    </Box>

                    <TableContainer sx={{ maxHeight: 400, ...scrollStyle }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Matrícula</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Nome</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Curso</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Matérias Pendentes</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Ação</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.near_graduation_students?.map((student) => (
                                    <TableRow key={student.id} hover>
                                        <TableCell>{student.registration}</TableCell>
                                        <TableCell>{student.name}</TableCell>
                                        <TableCell>{student.course}</TableCell>
                                        <TableCell align="center">
                                            <Chip 
                                                label={student.pending_obligatory} 
                                                color="success" 
                                                size="small" 
                                                variant={student.pending_obligatory === 0 ? "filled" : "outlined"}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Ver Histórico">
                                                <IconButton size="small" color="primary" onClick={() => navigate(`/students/${student.registration}`)}>
                                                    <TimelineIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!data.near_graduation_students || data.near_graduation_students.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                            Nenhum aluno próximo da formatura encontrado.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Grid>

        </Grid>
      </Container>
    </Box>
  );
};

export default IndicatorsReport;