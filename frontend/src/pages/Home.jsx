import { useContext, useEffect, useState } from 'react';
import { Box, Typography, Container, Grid, Paper } from '@mui/material';
import { alpha } from '@mui/material/styles';
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
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const ModuleCard = ({ icon: Icon, title, description, color, isEmpty, onClick }) => (
  <Paper
    elevation={0}
    onClick={isEmpty ? undefined : onClick}
    sx={{
      p: 2.5,
      height: '100%',
      border: '1px solid',
      borderColor: 'divider',
      borderLeft: isEmpty ? '4px solid transparent' : `4px solid ${color}`,
      borderRadius: 2,
      cursor: isEmpty ? 'default' : 'pointer',
      opacity: isEmpty ? 0.5 : 1,
      pointerEvents: isEmpty ? 'none' : 'auto',
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: 3,
        '& .card-arrow': {
          opacity: 1,
          transform: 'translateX(4px)',
        },
      },
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
      {/* Ícone em container colorido */}
      <Box
        sx={{
          p: 1.25,
          borderRadius: 2,
          bgcolor: isEmpty ? 'action.hover' : alpha(color, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 28, color: isEmpty ? 'text.disabled' : color }} />
      </Box>

      {/* Conteúdo */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{ color: isEmpty ? 'text.disabled' : 'text.primary', lineHeight: 1.3, fontSize: '1rem' }}
        >
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5 }}>
          {description}
        </Typography>
      </Box>

      {/* Seta */}
      <ChevronRightIcon
        className="card-arrow"
        sx={{
          color: 'text.disabled',
          flexShrink: 0,
          opacity: 0,
          transition: 'all 0.2s ease',
          mt: 0.25,
        }}
      />
    </Box>
  </Paper>
);

const Home = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { selectedSemester } = useContext(SemesterContext);

  const [emptyReports, setEmptyReports] = useState({
    records: false,
    students: false,
    courses: false,
    indicators: false,
  });

  useEffect(() => {
    const checkDataAvailability = async () => {
      let isCoursesEmpty = false;
      let isRecordsEmpty = true;
      let isStudentsEmpty = true;
      let isIndicatorsEmpty = true;

      try {
        const coursesRes = await api.get('/reports/courses');
        isCoursesEmpty = !coursesRes.data || coursesRes.data.length === 0;
      } catch {
        isCoursesEmpty = true;
      }

      if (selectedSemester) {
        try {
          const [recordsRes, studentsRes, indicatorsRes] = await Promise.all([
            api.get(`/reports/records?semester_id=${selectedSemester}`),
            api.get(`/reports/students?semester_id=${selectedSemester}`),
            api.get(`/reports/dashboard?semester_id=${selectedSemester}`),
          ]);
          isRecordsEmpty = !recordsRes.data || recordsRes.data.length === 0;
          isStudentsEmpty = !studentsRes.data || studentsRes.data.length === 0;
          isIndicatorsEmpty =
            !indicatorsRes.data?.status_distribution ||
            indicatorsRes.data.status_distribution.length === 0;
        } catch {
          // mantém como vazio
        }
      }

      setEmptyReports({
        courses: isCoursesEmpty,
        records: isRecordsEmpty,
        students: isStudentsEmpty,
        indicators: isIndicatorsEmpty,
      });
    };

    checkDataAvailability();
  }, [selectedSemester]);

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />

      <Container sx={{ mt: 5, mb: 6 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} color="text.primary">
            Painel Acadêmico
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Bem-vindo, {user?.name}. Selecione um módulo para continuar.
          </Typography>
        </Box>

        <Grid container spacing={2.5}>

          <Grid item xs={12} sm={6} md={4}>
            <ModuleCard
              icon={AssessmentIcon}
              title="Relatório Acadêmico"
              description="Visão detalhada de enquadramento, progressão e riscos de evasão."
              color="#059669"
              isEmpty={emptyReports.records}
              onClick={() => navigate('/report/records')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <ModuleCard
              icon={SchoolIcon}
              title="Base de Alunos"
              description="Listagem de alunos ativos no semestre selecionado e seus dados de ingresso."
              color="#0284C7"
              isEmpty={emptyReports.students}
              onClick={() => navigate('/report/students')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <ModuleCard
              icon={ClassIcon}
              title="Cursos & Coordenações"
              description="Consulte os cursos cadastrados e seus respectivos coordenadores."
              color="#D97706"
              isEmpty={emptyReports.courses}
              onClick={() => navigate('/report/courses')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <ModuleCard
              icon={AnalyticsIcon}
              title="Indicadores"
              description="Dashboard estratégico de retenção, alunos críticos e próximos da formatura."
              color="#7C3AED"
              isEmpty={emptyReports.indicators}
              onClick={() => navigate('/reports/indicators')}
            />
          </Grid>

          {user?.role === 'admin' && (
            <Grid item xs={12} sm={6} md={4}>
              <ModuleCard
                icon={PeopleIcon}
                title="Usuários do Sistema"
                description="Administração de acessos, cadastro de novos admins e permissões."
                color="#DC2626"
                isEmpty={false}
                onClick={() => navigate('/users')}
              />
            </Grid>
          )}

          {user?.role === 'admin' && (
            <Grid item xs={12} sm={6} md={4}>
              <ModuleCard
                icon={UploadFileIcon}
                title="Importar Dados"
                description="Faça upload de planilhas CSV/XLSX para atualizar a base de dados."
                color="#0891B2"
                isEmpty={false}
                onClick={() => navigate('/import')}
              />
            </Grid>
          )}

        </Grid>
      </Container>
    </Box>
  );
};

export default Home;
