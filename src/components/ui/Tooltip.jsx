import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

const OFFSET = 8;

const Tooltip = ({
    content,
    children,
    placement = 'top',
    delay = 500,
    className,
    disabled = false,
}) => {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);
    const timerRef = useRef(null);

    const show = () => {
        if (disabled || !content) return;
        timerRef.current = setTimeout(() => {
            position();
            setVisible(true);
        }, delay);
    };

    const hide = () => {
        clearTimeout(timerRef.current);
        setVisible(false);
    };

    const position = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;

        let top, left;

        switch (placement) {
            case 'bottom':
                top = rect.bottom + scrollY + OFFSET;
                left = rect.left + scrollX + rect.width / 2;
                break;
            case 'left':
                top = rect.top + scrollY + rect.height / 2;
                left = rect.left + scrollX - OFFSET;
                break;
            case 'right':
                top = rect.top + scrollY + rect.height / 2;
                left = rect.right + scrollX + OFFSET;
                break;
            default: // top
                top = rect.top + scrollY - OFFSET;
                left = rect.left + scrollX + rect.width / 2;
        }

        setCoords({ top, left });
    };

    useEffect(() => () => clearTimeout(timerRef.current), []);

    const transformOrigin = {
        top: 'bottom center',
        bottom: 'top center',
        left: 'right center',
        right: 'left center',
    }[placement];

    const translateY = placement === 'top' ? '-100%' : placement === 'bottom' ? '0%' : '-50%';
    const translateX = placement === 'left' ? '-100%' : placement === 'right' ? '0%' : '-50%';

    return (
        <>
            <span
                ref={triggerRef}
                onMouseEnter={show}
                onMouseLeave={hide}
                onFocus={show}
                onBlur={hide}
                className="inline-flex"
            >
                {children}
            </span>

            {createPortal(
                <AnimatePresence>
                    {visible && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.92 }}
                            transition={{ duration: 0.12 }}
                            style={{
                                position: 'absolute',
                                top: coords.top,
                                left: coords.left,
                                transform: `translate(${translateX}, ${translateY})`,
                                transformOrigin,
                                zIndex: 9999,
                                pointerEvents: 'none',
                            }}
                            className={clsx(
                                'px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap max-w-xs',
                                'bg-zinc-900 text-zinc-100 border border-zinc-700 shadow-xl backdrop-blur-sm',
                                className
                            )}
                        >
                            {content}
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};

export default Tooltip;
