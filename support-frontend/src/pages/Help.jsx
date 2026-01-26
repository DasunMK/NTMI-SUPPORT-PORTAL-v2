import React, { useState, useEffect } from 'react';
import { 
    Container, Typography, Box, Grid, Card, CardContent, Button, 
    Accordion, AccordionSummary, AccordionDetails, Fade, Stack, Avatar, Paper, Divider
} from '@mui/material';
import { 
    ExpandMore, Phone, Email, LibraryBooks, 
    BugReport, SupportAgent, LiveHelp, ChevronRight,
    Print, Wifi, History // Added meaningful icons
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const Help = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Default to closed, or specific panel if passed from Login
    const [expanded, setExpanded] = useState(false);

    // ✅ EFFECT: Check if we came from "Forgot Password" or other links
    useEffect(() => {
        if (location.state && location.state.focus) {
            setExpanded(location.state.focus);
            
            // Wait for render, then scroll
            setTimeout(() => {
                const element = document.getElementById(location.state.focus);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    }, [location]);

    const handleChange = (panel) => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    // ✅ UPDATED: Branch-Specific FAQs
    const faqs = [
        {
            id: 'panel1',
            question: "How do I reset my branch login password?",
            answer: "For security reasons, branch accounts cannot reset passwords directly. Please have your Branch Manager contact the IT Hotline (011-258-9999) for verification and a temporary reset code."
        },
        {
            id: 'panel2',
            question: "My branch printer is not showing up.",
            answer: "First, ensure the printer is powered on and connected to the network. If it's a network printer, try restarting it. If the issue persists, raise a ticket under category 'Hardware' > 'Printer/Scanner'."
        },
        {
            id: 'panel3',
            question: "The internet is very slow at our branch today.",
            answer: "This could be a service provider issue. Please check if other counters are experiencing the same slowness. If yes, raise a 'Critical' ticket under 'Network' so our network engineers can check the line status."
        },
        {
            id: 'panel4',
            question: "I attached the wrong photo to a ticket. Can I delete it?",
            answer: "To maintain an audit trail, you cannot delete evidence once submitted. Please add a 'Comment' to the ticket clarifying which image is correct, or upload the correct one in the comments."
        },
        {
            id: 'panel5',
            question: "Can I escalate a pending ticket?",
            answer: "If a ticket has been 'In Progress' for more than 48 hours without an update, you can call the IT Hotline with your Ticket ID to request an escalation."
        }
    ];

    const ContactCard = ({ icon, title, subtitle, detail, color, onClick }) => (
        <Card 
            elevation={0}
            onClick={onClick}
            sx={{ 
                borderRadius: 4, 
                border: '1px solid #f1f5f9',
                transition: 'all 0.3s ease',
                cursor: onClick ? 'pointer' : 'default',
                '&:hover': { 
                    transform: 'translateY(-4px)', 
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' 
                } 
            }}
        >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 3 }}>
                <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 56, height: 56 }}>
                    {icon}
                </Avatar>
                <Box>
                    <Typography variant="subtitle2" color="textSecondary" fontWeight="bold">
                        {title}
                    </Typography>
                    <Typography variant="h6" fontWeight="800" color="textPrimary">
                        {detail}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                        {subtitle}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );

    return (
        <Fade in={true} timeout={800}>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
                
                {/* 1. HERO HEADER */}
                <Paper 
                    elevation={0}
                    sx={{ 
                        p: 5, mb: 6, borderRadius: 4, 
                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                        color: 'white', position: 'relative', overflow: 'hidden'
                    }}
                >
                    <Box position="relative" zIndex={1}>
                        <Stack direction="row" alignItems="center" gap={2} mb={2}>
                            <SupportAgent sx={{ fontSize: 40, opacity: 0.8 }} />
                            <Typography variant="overline" letterSpacing={2} sx={{ opacity: 0.8 }}>
                                NTMI BRANCH SUPPORT
                            </Typography>
                        </Stack>
                        <Typography variant="h3" fontWeight="800" gutterBottom>
                            Hello, Branch User.
                        </Typography>
                        <Typography variant="h6" sx={{ opacity: 0.8, maxWidth: 600, fontWeight: 'normal' }}>
                            Need help with a device or system? Browse common solutions below or reach out to Central IT.
                        </Typography>
                    </Box>
                    
                    <Box sx={{ 
                        position: 'absolute', right: -50, top: -50, width: 300, height: 300, 
                        bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '50%' 
                    }} />
                </Paper>

                <Grid container spacing={4}>
                    
                    {/* 2. LEFT COLUMN: DIRECT SUPPORT & ACTIONS */}
                    <Grid item xs={12} md={4}>
                        <Typography variant="h6" fontWeight="bold" mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LiveHelp color="primary" /> Support Channels
                        </Typography>

                        <Stack spacing={2}>
                            <ContactCard 
                                icon={<Phone />} 
                                color="#2563eb"
                                title="IT Hotline (Urgent)"
                                detail="011-258-9999"
                                subtitle="Mon-Fri • 8:00 AM - 5:00 PM"
                            />
                            
                            <ContactCard 
                                icon={<Email />} 
                                color="#7c3aed"
                                title="Email Support"
                                detail="it.support@ntmi.lk"
                                subtitle="For non-urgent inquiries"
                            />

                            <Box pt={2}>
                                <Typography variant="subtitle2" fontWeight="bold" color="textSecondary" mb={2} pl={1}>
                                    QUICK ACTIONS
                                </Typography>
                                
                                <Button 
                                    fullWidth variant="outlined" color="primary"
                                    startIcon={<LibraryBooks />}
                                    endIcon={<ChevronRight />}
                                    sx={{ justifyContent: 'space-between', py: 1.5, mb: 2, borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
                                >
                                    Download System Manual
                                </Button>

                                <Button 
                                    fullWidth variant="outlined" color="secondary"
                                    startIcon={<History />}
                                    endIcon={<ChevronRight />}
                                    onClick={() => navigate('/dashboard')}
                                    sx={{ justifyContent: 'space-between', py: 1.5, mb: 2, borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
                                >
                                    View My Ticket History
                                </Button>

                                <Button 
                                    fullWidth variant="contained" color="error"
                                    startIcon={<BugReport />}
                                    onClick={() => navigate('/create-ticket')}
                                    sx={{ py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)' }}
                                >
                                    Report Technical Issue
                                </Button>
                            </Box>
                        </Stack>
                    </Grid>

                    {/* 3. RIGHT COLUMN: FAQ */}
                    <Grid item xs={12} md={8}>
                        <Typography variant="h6" fontWeight="bold" mb={3} pl={1}>
                            Common Branch Issues
                        </Typography>

                        {faqs.map((faq) => (
                            <Accordion 
                                key={faq.id} 
                                id={faq.id} 
                                expanded={expanded === faq.id} 
                                onChange={handleChange(faq.id)}
                                elevation={0}
                                sx={{ 
                                    mb: 2, 
                                    border: expanded === faq.id ? '1px solid #2563eb' : '1px solid #e2e8f0',
                                    borderRadius: '12px !important', 
                                    '&:before': { display: 'none' },
                                    overflow: 'hidden',
                                    transition: 'all 0.2s ease',
                                    boxShadow: expanded === faq.id ? '0 4px 12px rgba(37, 99, 235, 0.08)' : 'none'
                                }}
                            >
                                <AccordionSummary 
                                    expandIcon={<ExpandMore sx={{ color: expanded === faq.id ? 'primary.main' : 'text.secondary' }} />}
                                    sx={{ bgcolor: expanded === faq.id ? '#eff6ff' : 'white' }}
                                >
                                    <Stack direction="row" alignItems="center" gap={1}>
                                        {/* Icons for visual cue */}
                                        {faq.question.includes('printer') ? <Print fontSize="small" color="action"/> :
                                         faq.question.includes('internet') ? <Wifi fontSize="small" color="action"/> :
                                         null}
                                        <Typography fontWeight="bold" color={expanded === faq.id ? 'primary.main' : 'text.primary'}>
                                            {faq.question}
                                        </Typography>
                                    </Stack>
                                </AccordionSummary>
                                <AccordionDetails sx={{ bgcolor: 'white', px: 3, pb: 3 }}>
                                    <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />
                                    <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.6 }}>
                                        {faq.answer}
                                    </Typography>
                                </AccordionDetails>
                            </Accordion>
                        ))}

                        <Paper 
                            elevation={0} 
                            sx={{ 
                                mt: 4, p: 3, borderRadius: 3, 
                                bgcolor: '#f8fafc', border: '1px dashed #cbd5e1', 
                                textAlign: 'center' 
                            }}
                        >
                            <Typography variant="body2" color="textSecondary" mb={1}>
                                Facing a different issue?
                            </Typography>
                            <Button 
                                onClick={() => navigate('/create-ticket')} 
                                sx={{ fontWeight: 'bold', textTransform: 'none' }}
                            >
                                Raise a New Ticket &rarr;
                            </Button>
                        </Paper>
                    </Grid>

                </Grid>
            </Container>
        </Fade>
    );
};

export default Help;