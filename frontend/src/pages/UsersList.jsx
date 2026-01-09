import React, { useEffect, useState, useContext } from 'react';
import { 
  Box, Container, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Chip, Switch, Tooltip 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import Header from '../components/Header';
import api from '../services/api';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const { user: currentUser } = useContext(AuthContext);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      toast.error('Erro ao carregar usuários.');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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
      toast.success(`Usuário agora é ${newRole === 'admin' ? 'Admin' : 'Comum'}`);
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

  // Função auxiliar para definir o texto do Tooltip
  const getActionStatus = (u) => {
    if (u.ID === 1) return { disabled: true, text: "O Admin Principal é intocável" };
    if (isOwnProfile(u.ID)) return { disabled: true, text: "Você não pode alterar a si mesmo" };
    return { disabled: false, text: "" };
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 5 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" color="primary" fontWeight="bold" mb={3}>
            Gerenciamento de Usuários
          </Typography>
          
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
                      
                      {/* Switch Promover/Rebaixar */}
                      <Tooltip title={status.disabled ? status.text : "Alterar cargo"}>
                        <span>
                          <Switch 
                            checked={u.role === 'admin'}
                            onChange={() => handleToggleAdmin(u)}
                            disabled={status.disabled} 
                          />
                        </span>
                      </Tooltip>

                      {/* Botão Deletar */}
                      <Tooltip title={status.disabled ? status.text : "Excluir usuário"}>
                        <span>
                          <IconButton 
                            color="error" 
                            onClick={() => handleDelete(u.ID)}
                            disabled={status.disabled}
                          >
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