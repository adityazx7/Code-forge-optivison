'use client';

import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import Link from 'next/link';

export default function AnimatedLogo({ 
    href = "/", 
    className = "", 
    iconSize = 24, 
    textSize = "1.5rem",
    showText = true,
    isLink = true
}) {
    // Animation variants for the container to stagger children
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        },
        hover: {
            scale: 1.02,
            transition: { duration: 0.2 }
        }
    };

    // Glow pulsing animation for the icon box
    const iconBoxVariants = {
        hidden: { scale: 0.8, opacity: 0, rotate: -15 },
        visible: { 
            scale: 1, 
            opacity: 1, 
            rotate: 0,
            transition: { 
                type: "spring", 
                stiffness: 260, 
                damping: 20 
            }
        },
        hover: {
            boxShadow: "0 0 20px rgba(0, 212, 255, 0.6)",
            borderColor: "rgba(0, 212, 255, 0.8)",
            transition: { duration: 0.3 }
        }
    };

    // Staggered letter animation for the text
    const textVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { type: "spring", stiffness: 300, damping: 24 }
        }
    };

    const text = "OptiVision AI";

    const content = (
        <motion.div 
            className={`animated-logo-container ${className}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                cursor: isLink ? 'pointer' : 'default',
                textDecoration: 'none'
            }}
        >
            <motion.div 
                className="animated-icon-box"
                variants={iconBoxVariants}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: iconSize * 1.5,
                    height: iconSize * 1.5,
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
                    border: '1px solid rgba(0, 212, 255, 0.3)',
                    color: 'var(--accent-cyan)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Background shimmer effect */}
                <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ 
                        repeat: Infinity, 
                        duration: 3, 
                        ease: "linear",
                        repeatDelay: 2
                    }}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                        transform: 'skewX(-20deg)',
                    }}
                />
                <Zap size={iconSize} strokeWidth={2.5} />
            </motion.div>

            {showText && (
                <div style={{ display: 'flex', overflow: 'hidden' }}>
                    {text.split('').map((char, index) => (
                        <motion.span
                            key={index}
                            variants={textVariants}
                            style={{
                                fontSize: textSize,
                                fontWeight: 800,
                                letterSpacing: '-0.5px',
                                color: 'var(--text-primary)',
                                display: 'inline-block',
                                // Give "AI" a gradient color
                                ...((char === 'A' || char === 'I') && {
                                    background: 'var(--gradient-primary)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                })
                            }}
                        >
                            {char === ' ' ? '\u00A0' : char}
                        </motion.span>
                    ))}
                </div>
            )}
        </motion.div>
    );

    if (isLink) {
        return (
            <Link href={href} style={{ textDecoration: 'none' }}>
                {content}
            </Link>
        );
    }

    return content;
}
