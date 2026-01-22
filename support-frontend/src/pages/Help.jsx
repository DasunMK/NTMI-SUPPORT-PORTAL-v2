import React, { useState, useEffect } from 'react';
import { 
    Container, Typography, Box, Grid, Card, CardContent, Button, 
    Accordion, AccordionSummary, AccordionDetails, Fade, Stack, Avatar, Paper
} from '@mui/material';
import { 
    ExpandMore, Phone, Email, LibraryBooks, 
    BugReport, SupportAgent, LiveHelp, ChevronRight 
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const Help = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Default to closed, or specific panel if passed from Login
    const [expanded, setExpanded] = useState(false);

    // ✅ EFFECT: Check if we came from "Forgot Password"
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

    const faqs = [
        {
            id: 'panel1',
            question: "How do I reset my password?",
            answer: "For security reasons, branch users cannot reset their own passwords directly. Please contact the IT Hotline at 011-258-9999 to verify your identity and request a temporary password."
        },
        {
            id: 'panel2',
            question: "I uploaded the wrong screenshot. Can I delete it?",
            answer: "To maintain an audit trail, tickets cannot be edited once submitted. Please raise a new ticket referencing the ID of the mistake, or add a comment to the existing ticket asking Admin to ignore the file."
        },
        {
            id: 'panel3',
            question: "What is the expected response time?",
            answer: "We categorize response times by priority: 'Critical' (Hardware failure) issues are addressed within 2 hours. 'Medium' (Software/Access) requests are handled within 24 hours."
        },
        {
            id: 'panel4',
            question: "The system is running very slow.",
            answer: "First, try clearing your browser cache (Ctrl + Shift + R). If the issue persists across multiple branch computers, it may be a network issue. Please check your router before raising a ticket."
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
                                NTMI SUPPORT CENTER
                            </Typography>
                        </Stack>
                        <Typography variant="h3" fontWeight="800" gutterBottom>
                            How can we help you today?
                        </Typography>
                        <Typography variant="h6" sx={{ opacity: 0.8, maxWidth: 600, fontWeight: 'normal' }}>
                            Browse common questions below or contact the IT team directly for urgent matters.
                        </Typography>
                    </Box>
                    
                    <Box sx={{ 
                        position: 'absolute', right: -50, top: -50, width: 300, height: 300, 
                        bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '50%' 
                    }} />
                </Paper>

                <Grid container spacing={4}>
                    
                    {/* 2. LEFT COLUMN: DIRECT SUPPORT */}
                    <Grid item xs={12} md={4}>
                        <Typography variant="h6" fontWeight="bold" mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LiveHelp color="primary" /> Contact Support
                        </Typography>

                        <Stack spacing={2}>
                            <ContactCard 
                                icon={<Phone />} 
                                color="#2563eb"
                                title="Urgent Hardware Issues"
                                detail="011-258-9999"
                                subtitle="Mon-Fri • 8:00 AM - 5:00 PM"
                            />
                            
                            <ContactCard 
                                icon={<Email />} 
                                color="#7c3aed"
                                title="General Enquiries"
                                detail="support@ntmi.lk"
                                subtitle="Response within 24 hours"
                            />

                            <Box pt={2}>
                                <Typography variant="subtitle2" fontWeight="bold" color="textSecondary" mb={2} pl={1}>
                                    ACTIONS
                                </Typography>
                                
                                <Button 
                                    fullWidth variant="outlined" color="primary"
                                    startIcon={<LibraryBooks />}
                                    endIcon={<ChevronRight />}
                                    sx={{ justifyContent: 'space-between', py: 1.5, mb: 2, borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
                                >
                                    Download User Manual
                                </Button>

                                <Button 
                                    fullWidth variant="contained" color="error"
                                    startIcon={<BugReport />}
                                    onClick={() => navigate('/create-ticket')}
                                    sx={{ py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)' }}
                                >
                                    Report Critical Bug
                                </Button>
                            </Box>
                        </Stack>
                    </Grid>

                    {/* 3. RIGHT COLUMN: FAQ */}
                    <Grid item xs={12} md={8}>
                        <Typography variant="h6" fontWeight="bold" mb={3} pl={1}>
                            Frequently Asked Questions
                        </Typography>

                        {faqs.map((faq) => (
                            <Accordion 
                                key={faq.id} 
                                id={faq.id} // ✅ Added ID for scrolling target
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
                                    // Highlight effect if auto-expanded
                                    boxShadow: expanded === faq.id ? '0 0 0 4px rgba(37, 99, 235, 0.1)' : 'none'
                                }}
                            >
                                <AccordionSummary 
                                    expandIcon={<ExpandMore sx={{ color: expanded === faq.id ? 'primary.main' : 'text.secondary' }} />}
                                    sx={{ bgcolor: expanded === faq.id ? '#eff6ff' : 'white' }}
                                >
                                    <Typography fontWeight="bold" color={expanded === faq.id ? 'primary.main' : 'text.primary'}>
                                        {faq.question}
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ bgcolor: 'white', px: 3, pb: 3 }}>
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
                                Still can't find what you're looking for?
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