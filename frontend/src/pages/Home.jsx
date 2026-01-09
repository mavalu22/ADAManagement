import React, { useContext } from 'react'; // Importe useContext
import { Box, Typography, Container, Grid, Paper } from '@mui/material';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom'; // Importe useNavigate
import { AuthContext } from '../context/AuthContext'; // Importe AuthContext
import PeopleIcon from '@mui/icons-material/People'; // Importe Icone

const Home = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); // Pegue o user do contexto

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      
      <Container sx={{ mt: 5 }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary.main" fontWeight="bold">
          Painel Acadêmico
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
          Bem-vindo, {user?.name}. Selecione uma opção.
        </Typography>
        
        <Grid container spacing={3}>
            {/* Card para Admin: Gerenciar Usuários */}
            {user && user.role === 'admin' && (
              <Grid item xs={12} md={4}>
                  <Paper 
                    sx={{ 
                      p: 3, textAlign: 'center', cursor: 'pointer', 
                      '&:hover': { bgcolor: '#f5f5f5' } 
                    }}
                    onClick={() => navigate('/users')}
                  >
                      <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                      <Typography variant="h6">Usuários</Typography>
                      <Typography variant="body2" color="textSecondary">
                          Listar, promover e remover usuários.
                      </Typography>
                  </Paper>
              </Grid>
            )}
        </Grid>

      </Container>
    </Box>
  );
};

export default Home;