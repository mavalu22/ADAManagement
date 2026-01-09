import React, { useState } from 'react';
import { Box, Button, Container, TextField, Typography, Paper, Grid } from '@mui/material';
import api from '../services/api';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
// IMPORTAÇÃO NOVA
import { toast } from 'react-toastify';

const RegisterUser = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  // Removemos o estado 'status' pois o popup substitui ele

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await api.post('/register', formData);
      
      // 1. Popup de Sucesso
      toast.success(`Usuário ${formData.name} criado com sucesso!`);
      
      // 2. Redirecionamento Imediato para a Home
      navigate('/home');
      
    } catch (error) {
      console.error(error);
      // Popup de Erro
      toast.error('Erro ao cadastrar. Verifique se o e-mail já existe.');
    }
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />

      <Container maxWidth="md" sx={{ mt: 5 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5" color="primary" fontWeight="bold">
              Cadastrar Novo Usuário
              </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required fullWidth label="Nome Completo" name="name"
                  value={formData.name} onChange={handleChange}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required fullWidth label="E-mail" name="email" type="email"
                  value={formData.email} onChange={handleChange}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required fullWidth label="Senha Inicial" name="password" type="password"
                  value={formData.password} onChange={handleChange}
                  variant="outlined"
                />
              </Grid>
            </Grid>
            <Button type="submit" variant="contained" fullWidth size="large" sx={{ mt: 4 }}>
              Cadastrar Usuário
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default RegisterUser;