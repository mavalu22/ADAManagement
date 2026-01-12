import React, { useContext, useEffect, useState } from 'react';
import { Box, Typography, Container, Grid, Paper } from '@mui/material';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SemesterContext } from '../context/SemesterContext';
import api from '../services/api';

// Ícones para os Cards
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SchoolIcon from '@mui/icons-material/School';
import ClassIcon from '@mui/icons-material/Class';
import AnalyticsIcon from '@mui/icons-material/Analytics';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { selectedSemester } = useContext(SemesterContext);

  // Estado para controlar se os relatórios estão vazios
  const [emptyReports, setEmptyReports] = useState({
    records: false,
    students: false,
    courses: false,
    indicators: false
  });

  useEffect(() => {
    const checkDataAvailability = async () => {
        // Variáveis temporárias para o novo estado
        let isCoursesEmpty = false;
        let isRecordsEmpty = true;    // Assume vazio por segurança se não tiver semestre
        let isStudentsEmpty = true;
        let isIndicatorsEmpty = true;

        // 1. Checa Cursos (Independente de Semestre)
        try {
            const coursesRes = await api.get('/reports/courses');
            isCoursesEmpty = !coursesRes.data || coursesRes.data.length === 0;
        } catch (error) {
            console.error("Erro ao verificar cursos:", error);
            isCoursesEmpty = true; // Se der erro, bloqueia
        }

        // 2. Checa Relatórios Dependentes de Semestre
        if (selectedSemester) {
            try {
                const [recordsRes, studentsRes, indicatorsRes] = await Promise.all([
                    api.get(`/reports/records?semester_id=${selectedSemester}`),
                    api.get(`/reports/students?semester_id=${selectedSemester}`),
                    api.get(`/reports/dashboard?semester_id=${selectedSemester}`)
                ]);

                isRecordsEmpty = !recordsRes.data || recordsRes.data.length === 0;
                isStudentsEmpty = !studentsRes.data || studentsRes.data.length === 0;
                
                // Indicadores (verifica status_distribution)
                isIndicatorsEmpty = !indicatorsRes.data?.status_distribution || 
                                    indicatorsRes.data.status_distribution.length === 0;

            } catch (error) {
                console.error("Erro ao verificar relatórios por semestre:", error);
                // Mantém como true (vazio) se a API falhar
            }
        }

        // Atualiza o estado de uma vez
        setEmptyReports({
            courses: isCoursesEmpty,
            records: isRecordsEmpty,
            students: isStudentsEmpty,
            indicators: isIndicatorsEmpty
        });
    };

    checkDataAvailability();
  }, [selectedSemester]);

  // Função geradora de estilo (dinâmico baseado se está vazio ou não)
  const getCardStyle = (isEmpty) => ({
    p: 3, 
    textAlign: 'center', 
    cursor: isEmpty ? 'default' : 'pointer',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s, box-shadow 0.2s',
    
    // Estilos visuais de "Desabilitado"
    opacity: isEmpty ? 0.6 : 1,
    bgcolor: isEmpty ? 'action.hover' : 'background.paper',
    pointerEvents: isEmpty ? 'none' : 'auto',
    
    '&:hover': !isEmpty ? { 
        bgcolor: 'background.paper',
        transform: 'translateY(-5px)',
        boxShadow: 6 
    } : {}
  });

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      
      <Container sx={{ mt: 5 }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary.main" fontWeight="bold">
          Painel Acadêmico
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
          Bem-vindo, {user?.name}. Acesse os módulos abaixo.
        </Typography>
        
        <Grid container spacing={3}>
            
            {/* CARD 1: RELATÓRIO ACADÊMICO */}
            <Grid item xs={12} sm={6} md={4}>
                <Paper 
                    elevation={emptyReports.records ? 0 : 2} 
                    sx={getCardStyle(emptyReports.records)} 
                    onClick={() => !emptyReports.records && navigate('/report/records')}
                >
                    <AssessmentIcon sx={{ fontSize: 60, color: emptyReports.records ? 'text.disabled' : 'primary.main', mb: 2 }} />
                    <Typography variant="h6" fontWeight="bold" color={emptyReports.records ? 'text.disabled' : 'primary'}>
                        Relatório Acadêmico
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        {emptyReports.records ? "Sem dados para este semestre." : "Visão detalhada de enquadramento, progressão e riscos de evasão."}
                    </Typography>
                </Paper>
            </Grid>

            {/* CARD 2: ALUNOS */}
            <Grid item xs={12} sm={6} md={4}>
                <Paper 
                    elevation={emptyReports.students ? 0 : 2} 
                    sx={getCardStyle(emptyReports.students)} 
                    onClick={() => !emptyReports.students && navigate('/report/students')}
                >
                    <SchoolIcon sx={{ fontSize: 60, color: emptyReports.students ? 'text.disabled' : '#2e7d32', mb: 2 }} />
                    <Typography variant="h6" fontWeight="bold" sx={{ color: emptyReports.students ? 'text.disabled' : '#2e7d32' }}>
                        Base de Alunos
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        {emptyReports.students ? "Nenhum aluno encontrado." : "Listagem de alunos ativos no semestre selecionado e seus dados de ingresso."}
                    </Typography>
                </Paper>
            </Grid>

            {/* CARD 3: CURSOS */}
            <Grid item xs={12} sm={6} md={4}>
                <Paper 
                    elevation={emptyReports.courses ? 0 : 2} 
                    sx={getCardStyle(emptyReports.courses)} 
                    onClick={() => !emptyReports.courses && navigate('/report/courses')}
                >
                    <ClassIcon sx={{ fontSize: 60, color: emptyReports.courses ? 'text.disabled' : '#ed6c02', mb: 2 }} />
                    <Typography variant="h6" fontWeight="bold" sx={{ color: emptyReports.courses ? 'text.disabled' : '#ed6c02' }}>
                        Cursos & Coordenações
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                         {emptyReports.courses ? "Nenhum curso cadastrado." : "Consulte os cursos cadastrados e seus respectivos coordenadores."}
                    </Typography>
                </Paper>
            </Grid>

            {/* CARD 4: GESTÃO DE USUÁRIOS (Admin) */}
            {user && user.role === 'admin' && (
              <Grid item xs={12} sm={6} md={4}>
                  <Paper elevation={2} sx={getCardStyle(false)} onClick={() => navigate('/users')}>
                      <PeopleIcon sx={{ fontSize: 60, color: '#d32f2f', mb: 2 }} />
                      <Typography variant="h6" fontWeight="bold" sx={{ color: '#d32f2f' }}>
                          Usuários do Sistema
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          Administração de acessos, cadastro de novos admins e permissões.
                      </Typography>
                  </Paper>
              </Grid>
            )}

            {/* CARD 5: INDICADORES */}
            <Grid item xs={12} sm={6} md={4}>
                <Paper 
                    elevation={emptyReports.indicators ? 0 : 2} 
                    sx={getCardStyle(emptyReports.indicators)} 
                    onClick={() => !emptyReports.indicators && navigate('/reports/indicators')}
                >
                    <AnalyticsIcon sx={{ fontSize: 60, color: emptyReports.indicators ? 'text.disabled' : '#9c27b0', mb: 2 }} /> 
                    <Typography variant="h6" fontWeight="bold" sx={{ color: emptyReports.indicators ? 'text.disabled' : '#9c27b0' }}>
                        Indicadores
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        {emptyReports.indicators ? "Sem indicadores gerados." : "Dashboard estratégico de retenção e risco."}
                    </Typography>
                </Paper>
            </Grid>

        </Grid>
      </Container>
    </Box>
  );
};

export default Home;