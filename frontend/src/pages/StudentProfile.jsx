import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Container, Grid, Paper, Typography, Chip, Divider, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress 
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import Header from '../components/Header';
import api from '../services/api';

const StudentProfile = () => {
  const { registration } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
    const cleanRegistration = registration ? registration.trim() : '';

    if (!cleanRegistration) return;

    api.get(`/students/${cleanRegistration}/history`)
       .then(res => setData(res.data))
       .catch(err => {
           console.error("Erro na API:", err);
       })
       .finally(() => setLoading(false));
  }, [registration]);

  if (loading) return <LinearProgress />;
  if (!data) return <Typography sx={{p:4}}>Aluno não encontrado.</Typography>;

  const { student, history } = data;

  // Prepara dados para os gráficos (Recharts precisa de um array simples)
  const chartData = history.map(rec => ({
    name: rec.semester.code, // Eixo X (2025/1, 2025/2)
    integralizada: rec.integralized_hours,
    pendente: rec.pending_obligatory,
    trancamentos: rec.locks,
    status: rec.status
  }));

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        
        {/* CABEÇALHO DO ALUNO */}
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
            Voltar
        </Button>
        
        <Paper elevation={3} sx={{ p: 4, mb: 4, borderLeft: '6px solid #004b8d' }}>
            <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                    <Typography variant="h4" color="primary" fontWeight="bold">
                        {student.name}
                    </Typography>
                    <Typography variant="h6" color="textSecondary">
                        Matrícula: {student.registration}
                    </Typography>
                    <Typography variant="subtitle1">
                        Curso: <b>{student.course?.name}</b>
                    </Typography>
                </Grid>
                <Grid item xs={12} md={4} sx={{ textAlign: { md: 'right' } }}>
                    <Chip label={`Ingresso: ${student.entry_year}`} sx={{ mr: 1 }} />
                    <Chip label={student.quota_type} variant="outlined" />
                </Grid>
            </Grid>
        </Paper>

        <Grid container spacing={3}>
            
            {/* GRÁFICO 1: EVOLUÇÃO DA CARGA HORÁRIA (LINHA) */}
            <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3, height: 400 }}>
                    <Typography variant="h6" gutterBottom color="primary">
                        Evolução da Integralização (Horas)
                    </Typography>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            <Line type="monotone" dataKey="integralizada" stroke="#004b8d" strokeWidth={3} name="CH Cumprida" />
                        </LineChart>
                    </ResponsiveContainer>
                </Paper>
            </Grid>

            {/* GRÁFICO 2: PENDÊNCIAS (BARRAS) */}
            <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, height: 400 }}>
                    <Typography variant="h6" gutterBottom color="error">
                        Disciplinas Pendentes
                    </Typography>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <RechartsTooltip />
                            <Bar dataKey="pendente" fill="#d32f2f" name="Obrigatórias Faltantes" />
                        </BarChart>
                    </ResponsiveContainer>
                </Paper>
            </Grid>

            {/* TABELA: TIMELINE DETALHADA */}
            <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                        Histórico de Enquadramento (Timeline)
                    </Typography>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                    <TableCell>Semestre</TableCell>
                                    <TableCell>Status (Enquadramento)</TableCell>
                                    <TableCell>Detalhe</TableCell>
                                    <TableCell align="center">Trancamentos</TableCell>
                                    <TableCell align="center">Semestres s/ CH</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {history.map((rec) => (
                                    <TableRow key={rec.ID} hover>
                                        <TableCell><b>{rec.semester.code}</b></TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={rec.status} 
                                                color={rec.status === 'Em regularidade' ? 'success' : 'warning'}
                                                variant={rec.status === 'Desligamento' ? 'filled' : 'outlined'} 
                                            />
                                        </TableCell>
                                        <TableCell>{rec.status_detail}</TableCell>
                                        <TableCell align="center">{rec.locks}</TableCell>
                                        <TableCell align="center" sx={{ color: rec.semesters_no_hours > 0 ? 'error.main' : 'inherit', fontWeight: rec.semesters_no_hours > 0 ? 'bold' : 'normal' }}>
                                            {rec.semesters_no_hours}
                                        </TableCell>
                                    </TableRow>
                                ))}
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

export default StudentProfile;