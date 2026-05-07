import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ── Hoisted mocks for Clerk auth ──────────────────────
const mockUseUser = vi.fn();

// ── Mock next/link ────────────────────────────────────
vi.mock('next/link', () => ({
  default: ({ children, href, className, ...props }: any) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  ),
}));

// ── Mock @clerk/nextjs ────────────────────────────────
vi.mock('@clerk/nextjs', () => ({
  UserButton: ({ afterSignOutUrl }: any) => (
    <div data-testid="user-button">UserButton: {afterSignOutUrl}</div>
  ),
  useUser: () => mockUseUser(),
}));

// ── Mock framer-motion ────────────────────────────────
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: any) => (
      <div className={className}>{children}</div>
    ),
    h1: ({ children, className }: any) => (
      <h1 className={className}>{children}</h1>
    ),
    p: ({ children, className }: any) => (
      <p className={className}>{children}</p>
    ),
    span: ({ children, className }: any) => (
      <span className={className}>{children}</span>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useScroll: () => ({ scrollY: { get: () => 0 } }),
  useTransform: () => ({ get: () => 0 }),
}));

// ── Mock lucide-react icons ───────────────────────────
vi.mock('lucide-react', () => ({
  ArrowRight: () => <span data-testid="icon-arrow-right">→</span>,
  Shield: () => <span data-testid="icon-shield">Shield</span>,
  ChevronDown: () => <span data-testid="icon-chevron-down">↓</span>,
  Check: () => <span data-testid="icon-check">✓</span>,
  Star: () => <span data-testid="icon-star">★</span>,
  Moon: () => <span data-testid="icon-moon">Moon</span>,
  Calendar: () => <span data-testid="icon-calendar">Calendar</span>,
  Lock: () => <span data-testid="icon-lock">Lock</span>,
  BarChart3: () => <span data-testid="icon-bar-chart">BarChart</span>,
  Timer: () => <span data-testid="icon-timer">Timer</span>,
  Radio: () => <span data-testid="icon-radio">Radio</span>,
  Settings: () => <span data-testid="icon-settings">Settings</span>,
  Activity: () => <span data-testid="icon-activity">Activity</span>,
  FileText: () => <span data-testid="icon-file-text">FileText</span>,
  Menu: () => <span data-testid="icon-menu">☰</span>,
  X: () => <span data-testid="icon-x">✕</span>,
}));

// ── Mock Navbar (from @/components/Navbar) ────────────
vi.mock('@/components/Navbar', () => ({
  default: () => <nav data-testid="navbar">Navbar</nav>,
}));

// ── Mock Footer (from @/components/Footer) ────────────
vi.mock('@/components/Footer', () => ({
  default: () => <footer data-testid="footer">Footer</footer>,
}));

// ── Mock sub-components used in the page ──────────────
vi.mock('@/components/landing/AIThinkingBox', () => ({
  default: () => <div data-testid="ai-thinking-box">AIThinkingBox</div>,
}));

vi.mock('@/components/landing/EphemerisTable', () => ({
  default: () => <div data-testid="ephemeris-table">EphemerisTable</div>,
}));

vi.mock('@/components/landing/CandidateComparisonTable', () => ({
  default: () => (
    <div data-testid="candidate-comparison-table">
      CandidateComparisonTable
    </div>
  ),
}));

// ── Import AFTER all mocks ────────────────────────────
import LandingPage from '@/app/page';

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUser.mockReturnValue({ isSignedIn: false, isLoaded: true });
  });

  // ========== PAGE RENDERS ==========
  it('renders without crashing', () => {
    const { container } = render(<LandingPage />);
    expect(container).toBeTruthy();
  });

  // ========== NAVBAR ==========
  it('renders the Navbar', () => {
    render(<LandingPage />);
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
  });

  // ========== HERO SECTION ==========
  describe('Hero section', () => {
    it('renders the main heading', () => {
      const { container } = render(<LandingPage />);
      expect(container.textContent).toContain('Your birth time');
    });

    it('renders the subheading', () => {
      render(<LandingPage />);
      expect(
        screen.getByText(
          /AI-powered birth time rectification within seconds-level precision/,
        ),
      ).toBeInTheDocument();
    });

    it('renders the Vedic Birth Time Rectification badge', () => {
      render(<LandingPage />);
      expect(
        screen.getByText('Vedic Birth Time Rectification'),
      ).toBeInTheDocument();
    });

    it('renders hero stats', () => {
      render(<LandingPage />);
      expect(screen.getByText('Seconds')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
      expect(screen.getByText('NASA JPL')).toBeInTheDocument();
    });

    it('renders the primary CTA link', () => {
      render(<LandingPage />);
      const ctas = screen.getAllByText('Start Your Analysis');
      expect(ctas.length).toBeGreaterThanOrEqual(1);
      expect(ctas[0].closest('a')).toHaveAttribute('href', '/rectify');
    });
  });

  // ========== HOW IT WORKS SECTION ==========
  describe('How It Works section', () => {
    it('renders the section heading', () => {
      render(<LandingPage />);
      expect(
        screen.getByText('Six stages to your true birth time'),
      ).toBeInTheDocument();
    });

    it('renders the How It Works badge', () => {
      render(<LandingPage />);
      const badges = screen.getAllByText('How It Works');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    it('renders feature step titles', () => {
      render(<LandingPage />);
      expect(
        screen.getByText('Enter your birth details'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Share life events'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Get precise results'),
      ).toBeInTheDocument();
    });

    it('renders the live analysis engine sub-components in How It Works', () => {
      render(<LandingPage />);
      // EphemerisTable is shown by default (activeFeature === 0)
      expect(screen.getByTestId('ephemeris-table')).toBeInTheDocument();
    });
  });

  // ========== FEATURES SECTION ==========
  describe('Features section', () => {
    it('renders the features heading', () => {
      const { container } = render(<LandingPage />);
      expect(container.textContent).toContain('Powered by ancient');
    });
    it('renders the Features badge', () => {
      render(<LandingPage />);
      const badges = screen.getAllByText('Features');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    it('renders feature card titles', () => {
      render(<LandingPage />);
      expect(screen.getByText('Reports')).toBeInTheDocument();
      expect(screen.getByText('Live Work')).toBeInTheDocument();
      expect(
        screen.getByText('Multi-Method Validation'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('End-to-End Encryption'),
      ).toBeInTheDocument();
      // Some titles may have extra text, so use getByText with partial match or exact match
    });

    it('renders feature card tags', () => {
      render(<LandingPage />);
      expect(screen.getByText('Analysis')).toBeInTheDocument();
      expect(screen.getByText('Real-time')).toBeInTheDocument();
      expect(screen.getByText('Validation')).toBeInTheDocument();
      expect(screen.getByText('Security')).toBeInTheDocument();
      const precisionTags = screen.getAllByText('Precision');
      expect(precisionTags.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Organization')).toBeInTheDocument();
    });
  });

  // ========== PRIVACY SECTION ==========
  describe('Privacy section', () => {
    it('renders the privacy heading and subheading', () => {
      render(<LandingPage />);
      expect(screen.getByText('Privacy first')).toBeInTheDocument();
      expect(screen.getByText('with you in control')).toBeInTheDocument();
    });

    it('renders privacy toggle features', () => {
      render(<LandingPage />);
      expect(screen.getByText('Encrypt birth data')).toBeInTheDocument();
      expect(screen.getByText('Anonymous analysis')).toBeInTheDocument();
      expect(screen.getByText('No data sharing')).toBeInTheDocument();
      expect(screen.getByText('Auto-delete sessions')).toBeInTheDocument();
      expect(screen.getByText('Export your data')).toBeInTheDocument();
    });

    it('renders privacy description', () => {
      render(<LandingPage />);
      const gcmTexts = screen.getAllByText(/AES-256-GCM/);
      expect(gcmTexts.length).toBeGreaterThanOrEqual(1);
    });

    it('renders the privacy link', () => {
      render(<LandingPage />);
      const privacyLink = screen.getByText('Learn more about privacy');
      expect(privacyLink).toBeInTheDocument();
      expect(privacyLink.closest('a')).toHaveAttribute('href', '/privacy');
    });
  });

  // ========== CTA SECTION ==========
  describe('CTA section', () => {
    it('renders the CTA heading', () => {
      render(<LandingPage />);
      expect(
        screen.getByText(/Ready for a better/),
      ).toBeInTheDocument();
    });
    it('renders the CTA button', () => {
      render(<LandingPage />);
      const buttons = screen.getAllByText('Start Your Analysis');
      // There should be at least one (Hero has one, CTA has one)
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it('renders the free analysis subtext', () => {
      render(<LandingPage />);
      expect(
        screen.getByText('Free analysis. No credit card required.'),
      ).toBeInTheDocument();
    });
  });

  // ========== FOOTER ==========
  it('renders the Footer', () => {
    render(<LandingPage />);
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});
