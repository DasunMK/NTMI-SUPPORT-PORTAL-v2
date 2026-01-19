import React, { useState, useEffect } from 'react';
import { 
  Container, Paper, Typography, Box, Grid, TextField, MenuItem, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, Fade, IconButton
} from '@mui/material';
import { 
  Download, FilterList, Build, Refresh, Person, AccountCircle, Close
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api'; // Your API service

// Distinct Color Palette for Users
const PALETTE = [
  { bg: '#e3f2fd', text: '#1565c0', border: '#90caf9' }, // Blue
  { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' }, // Green
  { bg: '#f3e5f5', text: '#7b1fa2', border: '#ce93d8' }, // Purple
  { bg: '#fff3e0', text: '#e65100', border: '#ffcc80' }, // Orange
  { bg: '#ffebee', text: '#c62828', border: '#ef9a9a' }, // Red
];

export default function Reports() {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [userColorMap, setUserColorMap] = useState({});
  const [selectedTicket, setSelectedTicket] = useState(null);

  // --- FILTER STATES ---
  const [filterBranch, setFilterBranch] = useState('All');
  const [filterUser, setFilterUser] = useState('All'); // Assigned To
  const [filterRaisedBy, setFilterRaisedBy] = useState('All'); 
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All'); 
  const [filterType, setFilterType] = useState('All');         
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // --- DROPDOWN DATA ---
  const [branches, setBranches] = useState([]);
  const [admins, setAdmins] = useState([]); 
  const [branchUsers, setBranchUsers] = useState([]); 
  const [categories, setCategories] = useState([]); 
  const [types, setTypes] = useState([]);           

  // 1. FETCH DATA
  const loadData = async () => {
    try {
      const [ticketRes, branchRes, userRes, catRes, typeRes] = await Promise.all([
        api.get('/tickets'), // Admin: Get All Tickets
        api.get('/master-data/branches'),
        api.get('/users'),
        api.get('/master-data/categories'),
        api.get('/master-data/types')
      ]);

      const data = ticketRes.data;
      // Sort Newest First
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setTickets(data);
      setFilteredTickets(data);
      setBranches(branchRes.data);
      setCategories(catRes.data);
      setTypes(typeRes.data);

      const allUsers = userRes.data || [];
      setAdmins(allUsers.filter(u => u.role === 'ADMIN'));
      setBranchUsers(allUsers.filter(u => u.role === 'BRANCH_USER'));

    } catch (error) {
      console.error("Error loading report data", error);
    }
  };

  useEffect(() => { loadData(); }, []);

  // 2. GENERATE COLORS
  useEffect(() => {
    if (tickets.length > 0) {
        const uniqueUsers = [...new Set(tickets.map(t => t.assignedUser?.fullName).filter(Boolean))];
        const newColorMap = {};
        uniqueUsers.forEach((user, index) => {
            newColorMap[user] = PALETTE[index % PALETTE.length];
        });
        setUserColorMap(newColorMap);
    }
  }, [tickets]);

  // 3. FILTER LOGIC
  useEffect(() => {
    let result = tickets;

    if (filterBranch !== 'All') result = result.filter(t => t.branch?.branchName === filterBranch);
    if (filterUser !== 'All') result = result.filter(t => t.assignedUser?.fullName === filterUser);
    if (filterRaisedBy !== 'All') result = result.filter(t => t.createdBy?.fullName === filterRaisedBy);
    if (filterCategory !== 'All') result = result.filter(t => t.errorCategory?.categoryName === filterCategory); 
    if (filterType !== 'All') result = result.filter(t => t.errorType?.typeName === filterType);             
    if (filterStatus !== 'All') result = result.filter(t => t.status === filterStatus);
    
    if (dateRange.start) result = result.filter(t => t.createdAt >= dateRange.start);
    if (dateRange.end) result = result.filter(t => t.createdAt <= dateRange.end + "T23:59:59");

    setFilteredTickets(result);
  }, [tickets, filterBranch, filterUser, filterRaisedBy, filterCategory, filterType, filterStatus, dateRange]);

  const availableTypes = filterCategory === 'All' 
    ? types 
    : types.filter(t => t.category?.categoryName === filterCategory);

  // 4. PDF GENERATOR
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(25, 118, 210);
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("NTMI Ticket Report", 14, 13);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    let filterText = `Generated: ${new Date().toLocaleDateString()} | Total: ${filteredTickets.length}`;
    if(filterBranch !== 'All') filterText += ` | Branch: ${filterBranch}`;
    doc.text(filterText, 14, 28);

    const tableColumn = ["ID", "Branch", "Category", "Type", "Raised By", "Fixed By", "Status"];
    const tableRows = filteredTickets.map(t => [
        t.ticketId,
        t.branch?.branchName || "-",
        t.errorCategory?.categoryName || "-",
        t.errorType?.typeName || "-",
        t.createdBy?.fullName || "-",
        t.assignedUser?.fullName || "-",
        t.status
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [25, 118, 210] },
      styles: { fontSize: 8 }
    });

    doc.save(`NTMI_Report_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  return (
    <Fade in={true}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        
        {/* HEADER */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <div>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>Ticket Reports</Typography>
            <Typography variant="body2" color="text.secondary">Filter, analyze, and export system history.</Typography>
          </div>
          <Box sx={{ display: 'flex', gap: 2 }}>
             <Button variant="outlined" startIcon={<Refresh />} onClick={loadData}>Refresh</Button>
             <Button variant="contained" color="secondary" startIcon={<Download />} onClick={generatePDF}>Download PDF</Button>
          </Box>
        </Box>

        {/* FILTERS */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
          <Grid container spacing={2} alignItems="center">
            
            <Grid item xs={12} md={1} sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                <FilterList sx={{ mr: 1 }} /> Filters:
            </Grid>

            {/* Row 1: Users & Branch */}
            <Grid item xs={12} md={2}>
                <TextField select fullWidth size="small" label="Branch" value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)}>
                    <MenuItem value="All">All Branches</MenuItem>
                    {branches.map((b) => <MenuItem key={b.branchId} value={b.branchName}>{b.branchName}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField select fullWidth size="small" label="Raised By" value={filterRaisedBy} onChange={(e) => setFilterRaisedBy(e.target.value)}>
                    <MenuItem value="All">All Users</MenuItem>
                    {branchUsers.map((u) => <MenuItem key={u.userId} value={u.fullName}>{u.fullName}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField select fullWidth size="small" label="Handled By" value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
                    <MenuItem value="All">All Admins</MenuItem>
                    {admins.map((u) => <MenuItem key={u.userId} value={u.fullName}>{u.fullName}</MenuItem>)}
                </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField select fullWidth size="small" label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <MenuItem value="All">All</MenuItem>
                    <MenuItem value="OPEN">Open</MenuItem>
                    <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                    <MenuItem value="RESOLVED">Resolved</MenuItem>
                </TextField>
            </Grid>

            {/* Row 2: Category, Type & Dates */}
            <Grid item xs={12} md={1} sx={{ display: { xs: 'none', md: 'block' } }}></Grid> 
            
            <Grid item xs={12} md={2}>
                <TextField select fullWidth size="small" label="Category" value={filterCategory} onChange={(e) => {
                    setFilterCategory(e.target.value);
                    setFilterType('All'); 
                }}>
                    <MenuItem value="All">All Categories</MenuItem>
                    {categories.map((c) => <MenuItem key={c.categoryId} value={c.categoryName}>{c.categoryName}</MenuItem>)}
                </TextField>
            </Grid>

            <Grid item xs={12} md={2}>
                <TextField select fullWidth size="small" label="Error Type" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <MenuItem value="All">All Types</MenuItem>
                    {availableTypes.map((t) => <MenuItem key={t.typeId} value={t.typeName}>{t.typeName}</MenuItem>)}
                </TextField>
            </Grid>

            <Grid item xs={12} md={2}>
                <TextField type="date" fullWidth size="small" label="From" InputLabelProps={{ shrink: true }} value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} />
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField type="date" fullWidth size="small" label="To" InputLabelProps={{ shrink: true }} value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} />
            </Grid>

             <Grid item xs={12} md={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button size="small" color="error" variant="outlined" startIcon={<Refresh />} onClick={() => {
                    setFilterBranch('All'); setFilterUser('All'); setFilterRaisedBy('All'); 
                    setFilterStatus('All'); setFilterCategory('All'); setFilterType('All');
                    setDateRange({start:'', end:''});
                }}>Clear All Filters</Button>
            </Grid>
          </Grid>
        </Paper>

        {/* TABLE */}
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead sx={{ bgcolor: '#eeeeee' }}>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Branch</strong></TableCell>
                <TableCell><strong>Issue Type</strong></TableCell>
                <TableCell><strong>Description</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Raised By</strong></TableCell>
                <TableCell><strong>Handled By</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTickets.length === 0 ? (
                  <TableRow><TableCell colSpan={8} align="center">No tickets match your filters.</TableCell></TableRow>
              ) : (
                  filteredTickets.map((t) => {
                      const assignedName = t.assignedUser?.fullName;
                      const userColors = userColorMap[assignedName] || { bg: '#f5f5f5', text: '#616161', border: '#e0e0e0' };

                      return (
                          <TableRow 
                              key={t.ticketId} 
                              hover 
                              onClick={() => setSelectedTicket(t)} 
                              sx={{ cursor: 'pointer' }}           
                          >
                              <TableCell>#{t.ticketId}</TableCell>
                              <TableCell>{t.branch?.branchName || 'Unknown'}</TableCell>
                              <TableCell>
                                  <strong>{t.errorCategory?.categoryName}</strong>
                                  <Typography variant="caption" display="block" color="text.secondary">{t.errorType?.typeName}</Typography>
                              </TableCell>
                              <TableCell sx={{ maxWidth: 200 }}>
                                  <Typography variant="body2" noWrap title={t.description}>
                                      {t.description || "No description"}
                                  </Typography>
                              </TableCell>
                              <TableCell>{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                              
                              <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Person fontSize="small" color="action" />
                                      <Typography variant="body2">{t.createdBy?.fullName || "System"}</Typography>
                                  </Box>
                              </TableCell>

                              <TableCell>
                                  {assignedName ? (
                                      <Chip 
                                          icon={<Build sx={{ fontSize: '14px !important', color: `${userColors.text} !important` }} />} 
                                          label={assignedName} 
                                          size="small" 
                                          sx={{ 
                                              borderRadius: 1, 
                                              fontWeight: 'bold',
                                              bgcolor: userColors.bg, 
                                              color: userColors.text,   
                                              border: `1px solid ${userColors.border}`
                                          }}
                                      />
                                  ) : (
                                      <Typography variant="caption" color="text.secondary">-</Typography>
                                  )}
                              </TableCell>

                              <TableCell>
                                  <Chip 
                                      label={t.status.replace('_', ' ')} 
                                      color={t.status === 'RESOLVED' ? 'success' : t.status === 'IN_PROGRESS' ? 'warning' : 'error'} 
                                      size="small"
                                      sx={{ fontWeight: 'bold', minWidth: 80 }}
                                  />
                              </TableCell>
                          </TableRow>
                      );
                  })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* DETAIL POPUP */}
        {selectedTicket && (
          <Dialog open={Boolean(selectedTicket)} onClose={() => setSelectedTicket(null)} fullWidth maxWidth="sm">
              <DialogTitle sx={{ bgcolor: '#f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                      <Typography variant="subtitle1" fontWeight="bold">Ticket Details</Typography>
                      <Typography variant="caption" color="text.secondary">#{selectedTicket.ticketId}</Typography>
                  </Box>
                  <IconButton onClick={() => setSelectedTicket(null)} size="small"><Close /></IconButton>
              </DialogTitle>
              
              <DialogContent dividers>
                  <Grid container spacing={2}>
                      <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Branch</Typography>
                          <Typography variant="body1" fontWeight="bold">{selectedTicket.branch?.branchName}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Raised By</Typography>
                          <Typography variant="body1">{selectedTicket.createdBy?.fullName}</Typography>
                      </Grid>

                      <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary">Category</Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {selectedTicket.errorCategory?.categoryName} - {selectedTicket.errorType?.typeName}
                          </Typography>
                      </Grid>

                      <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary">Description</Typography>
                          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#fafafa', maxHeight: 150, overflow: 'auto' }}>
                              <Typography variant="body2">{selectedTicket.description}</Typography>
                          </Paper>
                      </Grid>
                    
                      {(selectedTicket.assignedUser || selectedTicket.status === 'IN_PROGRESS') && (
                          <Grid item xs={12}>
                               <Alert severity="info" icon={<AccountCircle />}>
                                  Handled By: <strong>{selectedTicket.assignedUser?.fullName || "IT Support Admin"}</strong>
                               </Alert>
                          </Grid>
                      )}
                  </Grid>
              </DialogContent>
              
              <DialogActions>
                  <Button onClick={() => setSelectedTicket(null)} variant="contained">Close</Button>
              </DialogActions>
          </Dialog>
        )}

      </Container>
    </Fade>
  );
}