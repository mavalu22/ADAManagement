import React, { useContext } from 'react';
import { Box, Typography, Container, Grid, Paper } from '@mui/material'; // Removido Card, CardContent, etc, pois não são mais usados
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// Ícones para os Cards
import PeopleIcon from '@mui/icons-material/People';       // Gestão de Usuários
import AssessmentIcon from '@mui/icons-material/Assessment'; // Relatório Acadêmico
import SchoolIcon from '@mui/icons-material/School';       // Relatório de Alunos
import ClassIcon from '@mui/icons-material/Class';         // Relatório de Cursos
import AnalyticsIcon from '@mui/icons-material/Analytics'; // Ícone diferente para Indicadores (para não repetir o Assessment)

const Home = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Estilo comum para os cards (efeito hover e tamanho)
  const cardStyle = {
    p: 3, 
    textAlign: 'center', 
    cursor: 'pointer', 
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': { 
        bgcolor: 'background.paper', // Um azul muito suave no fundo
        transform: 'translateY(-5px)', // Levanta um pouco
        boxShadow: 6 
    }
  };

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
            
            {/* CARD 1: RELATÓRIO ACADÊMICO (O principal) */}
            <Grid item xs={12} sm={6} md={4}>
                <Paper elevation={2} sx={cardStyle} onClick={() => navigate('/report/records')}>
                    <AssessmentIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" fontWeight="bold" color="primary">
                        Relatório Acadêmico
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        Visão detalhada de enquadramento, progressão e riscos de evasão.
                    </Typography>
                </Paper>
            </Grid>

            {/* CARD 2: ALUNOS */}
            <Grid item xs={12} sm={6} md={4}>
                <Paper elevation={2} sx={cardStyle} onClick={() => navigate('/report/students')}>
                    <SchoolIcon sx={{ fontSize: 60, color: '#2e7d32', mb: 2 }} /> {/* Verde */}
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#2e7d32' }}>
                        Base de Alunos
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        Listagem de alunos ativos no semestre selecionado e seus dados de ingresso.
                    </Typography>
                </Paper>
            </Grid>

            {/* CARD 3: CURSOS */}
            <Grid item xs={12} sm={6} md={4}>
                <Paper elevation={2} sx={cardStyle} onClick={() => navigate('/report/courses')}>
                    <ClassIcon sx={{ fontSize: 60, color: '#ed6c02', mb: 2 }} /> {/* Laranja */}
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#ed6c02' }}>
                        Cursos & Coordenações
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        Consulte os cursos cadastrados e seus respectivos coordenadores.
                    </Typography>
                </Paper>
            </Grid>

            {/* CARD 4: GESTÃO DE USUÁRIOS (Apenas Admin) */}
            {user && user.role === 'admin' && (
              <Grid item xs={12} sm={6} md={4}>
                  <Paper elevation={2} sx={cardStyle} onClick={() => navigate('/users')}>
                      <PeopleIcon sx={{ fontSize: 60, color: '#d32f2f', mb: 2 }} /> {/* Vermelho */}
                      <Typography variant="h6" fontWeight="bold" sx={{ color: '#d32f2f' }}>
                          Usuários do Sistema
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          Administração de acessos, cadastro de novos admins e permissões.
                      </Typography>
                  </Paper>
              </Grid>
            )}

            {/* CARD 5: INDICADORES (Agora padronizado) */}
            <Grid item xs={12} sm={6} md={4}>
                <Paper elevation={2} sx={cardStyle} onClick={() => navigate('/reports/indicators')}>
                    {/* Usei AnalyticsIcon para diferenciar do Relatório Acadêmico, mas mantive a cor roxa */}
                    <AnalyticsIcon sx={{ fontSize: 60, color: '#9c27b0', mb: 2 }} /> 
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#9c27b0' }}>
                        Indicadores
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        Dashboard estratégico de retenção e risco.
                    </Typography>
                </Paper>
            </Grid>

        </Grid>
      </Container>
    </Box>
  );
};

export default Home;