import React, { useEffect, useState, useContext, useRef } from 'react';
import { 
  Box, Container, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Chip, Switch, Tooltip,
  Grid, TextField, MenuItem, Button
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import Header from '../components/Header';
import api from '../services/api';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const { user: currentUser } = useContext(AuthContext);
  
  // 1. REFS para campos de texto (Performance: não re-renderiza ao digitar)
  const nameRef = useRef(null);
  const emailRef = useRef(null);

  // 2. STATE para o Select (Necessário para limpar visualmente o dropdown)
  const [role, setRole] = useState('');

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      
      // Leitura dos Refs
      if (nameRef.current?.value) params.append('name', nameRef.current.value);
      if (emailRef.current?.value) params.append('email', emailRef.current.value);
      
      // Leitura do State
      if (role) params.append('role', role);

      const response = await api.get(`/users?${params.toString()}`);
      setUsers(response.data);
    } catch (error) {
      toast.error('Erro ao carregar usuários.');
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClear = () => {
    // Limpa os campos de texto
    if (nameRef.current) nameRef.current.value = '';
    if (emailRef.current) emailRef.current.value = '';
    
    // Limpa o dropdown visualmente atualizando o estado
    setRole('');
  };

  // Funções de Ação (Delete/Update)
  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja remover este usuário?")) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success("Usuário removido.");
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || "Erro ao deletar.");
    }
  };

  const handleToggleAdmin = async (targetUser) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    try {
      await api.put(`/users/${targetUser.ID}`, { role: newRole });
      toast.success(`Permissão alterada com sucesso.`);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || "Erro ao alterar permissão.");
    }
  };

  const isOwnProfile = (targetUserId) => {
    if (!currentUser) return false;
    const currentId = currentUser.id || currentUser.ID;
    return targetUserId === currentId;
  };

  const getActionStatus = (u) => {
    if (u.ID === 1) return { disabled: true, text: "O Admin Principal é intocável" };
    if (isOwnProfile(u.ID)) return { disabled: true, text: "Você não pode alterar a si mesmo" };
    return { disabled: false, text: "" };
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 5 }}>
        
        <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
          <Typography variant="h5" color="primary" fontWeight="bold" mb={3}>
            Gerenciamento de Usuários
          </Typography>
          
          {/* Filtros */}
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Nome" inputRef={nameRef} size="small" />
            </Grid>
            <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Email" inputRef={emailRef} size="small" />
            </Grid>
            <Grid item xs={12} sm={2}>
                <TextField 
                    select 
                    fullWidth 
                    label="Permissão" 
                    value={role} 
                    onChange={(e) => setRole(e.target.value)} 
                    size="small"
                >
                    <MenuItem value="">Todas</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="user">Usuário</MenuItem>
                </TextField>
            </Grid>
            <Grid item xs={12} sm={2} sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" onClick={fetchUsers}><SearchIcon/></Button>
                <Button variant="outlined" onClick={handleClear}><ClearIcon/></Button>
            </Grid>
          </Grid>
        </Paper>
          
        <Paper elevation={3}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Nome</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Permissão</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => {
                  const status = getActionStatus(u);
                  return (
                  <TableRow key={u.ID}>
                    <TableCell>{u.ID}</TableCell>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={u.role === 'admin' ? "Administrador" : "Usuário"} 
                        color={u.role === 'admin' ? "primary" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={status.disabled ? status.text : "Alterar cargo"}>
                        <span>
                          <Switch 
                            checked={u.role === 'admin'}
                            onChange={() => handleToggleAdmin(u)}
                            disabled={status.disabled} 
                          />
                        </span>
                      </Tooltip>
                      <Tooltip title={status.disabled ? status.text : "Excluir usuário"}>
                        <span>
                          <IconButton color="error" onClick={() => handleDelete(u.ID)} disabled={status.disabled}>
                            <DeleteIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    </Box>
  );
};

export default UsersList;