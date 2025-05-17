// frontend/components/layout/Navbar.tsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import { LogOut, UserCircle, ShieldCheck, Gamepad2, Trophy, Home } from 'lucide-react';

const Navbar: React.FC = () => {
    const { user, logout, isLoading } = useAuth();
    const router = useRouter();

    const navItems = [
        { href: '/', label: 'Home', icon: <Home size={18} /> },
        { href: '/game', label: 'Spielen', icon: <Gamepad2 size={18} />, auth: true },
        { href: '/leaderboard', label: 'Leaderboard', icon: <Trophy size={18} /> },
        { href: '/admin', label: 'Admin', icon: <ShieldCheck size={18} />, admin: true },
    ];

    return (
        <nav className="bg-surface shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="text-2xl font-bold text-primary hover:text-primary-dark transition-colors">
                            QuizDuell
                        </Link>
                        <div className="hidden md:flex md:ml-10 md:space-x-8">
                            {navItems.map((item) => {
                                if ((item.auth && !user) || (item.admin && user?.role !== 'ADMIN')) {
                                    return null;
                                }
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium
                      ${
                                            router.pathname === item.href || (item.href !== '/' && router.pathname.startsWith(item.href))
                                                ? 'border-primary text-primary'
                                                : 'border-transparent text-textSecondary hover:border-neutral hover:text-textPrimary'
                                        }`}
                                    >
                                        {item.icon && <span className="mr-2">{item.icon}</span>}
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex items-center">
                        {isLoading ? (
                            <div className="text-sm text-textSecondary">Lade...</div>
                        ) : user ? (
                            <>
                <span className="hidden sm:inline mr-3 text-sm text-textSecondary">
                  Hallo, {user.name} {user.uniHandle && `(${user.uniHandle})`}
                </span>
                                <Button onClick={logout} variant="ghost" size="sm" leftIcon={<LogOut size={16} />}>
                                    Logout
                                </Button>
                            </>
                        ) : (
                            <div className="space-x-2">
                                <Link href="/login">
                                    <Button variant="outline" size="sm">Login</Button>
                                </Link>
                                <Link href="/register">
                                    <Button variant="primary" size="sm">Registrieren</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;