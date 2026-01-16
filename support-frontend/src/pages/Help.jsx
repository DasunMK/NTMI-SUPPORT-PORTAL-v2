import React, { useState } from 'react';
import { 
    Container, Typography, Box, Grid, Card, CardContent, Button, 
    Accordion, AccordionSummary, AccordionDetails, Fade, Divider, Chip 
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import BugReportIcon from '@mui/icons-material/BugReport';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useNavigate } from 'react-router-dom';

const Help = () => {
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState(false);

    const handleChange = (panel) => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    const faqs = [
        {
            id: 'panel1',
            question: "How do I reset my password?",
            answer: "For security reasons, branch users cannot reset their own passwords. Please contact the IT Hotline at 011-2345678 to request a password reset."
        },
        {
            id: 'panel2',
            question: "I uploaded the wrong screenshot. Can I delete it?",
            answer: "Currently, once a ticket is submitted, you cannot edit it. Please raise a new ticket referencing the old one, or contact support if it's urgent."
        },
        {
            id: 'panel3',
            question: "What is the expected response time?",
            answer: "For 'Critical' hardware issues, our team responds within 2 hours. For routine software requests, the standard response time is 24 hours."
        },
        {
            id: 'panel4',
            question: "The system is running very slow.",
            answer: "Please try clearing your browser cache (Ctrl + Shift + R). If the issue persists, check your branch internet connection before raising a ticket."
        }
    ];

    return (
        <Fade in={true} timeout={800}>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                
                {/* Header */}
                <Box mb={4} textAlign="center">
                    <Typography variant="h4" fontWeight="bold" gutterBottom color="primary">
                        How can we help you?
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                        Find answers, contact support, or manage your requests.
                    </Typography>
                </Box>

                <Grid container spacing={4}>
                    
                    {/* LEFT COLUMN: CONTACT & ACTIONS */}
                    <Grid item xs={12} md={4}>
                        <Box display="flex" flexDirection="column" gap={3}>
                            
                            {/* Contact Card */}
                            <Card elevation={0} sx={{ borderRadius: 4, bgcolor: '#e3f2fd', border: '1px solid #bbdefb' }}>
                                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                    <PhoneIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                                    <Typography variant="h6" fontWeight="bold">IT Hotline</Typography>
                                    <Typography variant="body2" color="textSecondary" gutterBottom>
                                        Available Mon-Fri, 8am-5pm
                                    </Typography>
                                    <Typography variant="h5" color="primary" fontWeight="bold" sx={{ mt: 1 }}>
                                        011-258-9999
                                    </Typography>
                                </CardContent>
                            </Card>

                            <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e0e0e0' }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <EmailIcon color="action" />
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight="bold">Email Support</Typography>
                                        <Typography variant="body2" color="textSecondary">support@ntmi.lk</Typography>
                                    </Box>
                                </CardContent>
                            </Card>

                            {/* Quick Actions */}
                            <Box mt={2}>
                                <Typography variant="overline" fontWeight="bold" color="textSecondary">
                                    Quick Actions
                                </Typography>
                                <Button 
                                    fullWidth 
                                    variant="outlined" 
                                    startIcon={<LibraryBooksIcon />} 
                                    sx={{ mt: 1, justifyContent: 'flex-start', py: 1.5, borderRadius: 2 }}
                                >
                                    Download User Manual
                                </Button>
                                <Button 
                                    fullWidth 
                                    variant="outlined" 
                                    color="error"
                                    startIcon={<BugReportIcon />} 
                                    onClick={() => navigate('/create-ticket')}
                                    sx={{ mt: 2, justifyContent: 'flex-start', py: 1.5, borderRadius: 2 }}
                                >
                                    Report a Critical Bug
                                </Button>
                            </Box>
                        </Box>
                    </Grid>

                    {/* RIGHT COLUMN: FAQ ACCORDION */}
                    <Grid item xs={12} md={8}>
                        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <HelpOutlineIcon color="primary" />
                            <Typography variant="h6" fontWeight="bold">
                                Frequently Asked Questions
                            </Typography>
                        </Box>
                        
                        {faqs.map((faq) => (
                            <Accordion 
                                key={faq.id} 
                                expanded={expanded === faq.id} 
                                onChange={handleChange(faq.id)}
                                elevation={0}
                                sx={{ 
                                    mb: 2, 
                                    border: '1px solid #e0e0e0', 
                                    borderRadius: '12px !important', 
                                    '&:before': { display: 'none' }, // Remove default line
                                    overflow: 'hidden'
                                }}
                            >
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography fontWeight="medium">{faq.question}</Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ bgcolor: '#fafafa' }}>
                                    <Typography variant="body2" color="textSecondary">
                                        {faq.answer}
                                    </Typography>
                                </AccordionDetails>
                            </Accordion>
                        ))}

                        {/* Footer Note */}
                        <Box mt={4} p={3} bgcolor="#f5f5f5" borderRadius={3} textAlign="center">
                            <Typography variant="body2" color="textSecondary">
                                Can't find what you're looking for? 
                                <Button size="small" onClick={() => navigate('/create-ticket')} sx={{ ml: 1, fontWeight: 'bold' }}>
                                    Raise a Ticket
                                </Button>
                            </Typography>
                        </Box>
                    </Grid>

                </Grid>
            </Container>
        </Fade>
    );
};

export default Help;