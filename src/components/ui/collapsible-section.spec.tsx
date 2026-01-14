import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CollapsibleSection } from './collapsible-section';
import { Settings } from 'lucide-react';

describe('CollapsibleSection', () => {
  it('should render title', () => {
    render(
      <CollapsibleSection
        title="Test Section"
        open={false}
        onOpenChange={() => {}}
      >
        <div>Content</div>
      </CollapsibleSection>
    );
    expect(screen.getByText('Test Section')).toBeInTheDocument();
  });

  it('should render icon if provided', () => {
    render(
      <CollapsibleSection
        title="Test Section"
        icon={Settings}
        open={false}
        onOpenChange={() => {}}
      >
        <div>Content</div>
      </CollapsibleSection>
    );
    // Lucide icons render as SVGs, we can check for the class or presence
    const icon = document.querySelector('.lucide-settings');
    expect(icon).toBeInTheDocument();
  });

  it('should render subtitle if provided', () => {
    render(
      <CollapsibleSection
        title="Test Section"
        subtitle="(Details)"
        open={false}
        onOpenChange={() => {}}
      >
        <div>Content</div>
      </CollapsibleSection>
    );
    expect(screen.getByText('(Details)')).toBeInTheDocument();
  });

  it('should not render content when closed', () => {
    render(
      <CollapsibleSection
        title="Test Section"
        open={false}
        onOpenChange={() => {}}
      >
        <div>Hidden Content</div>
      </CollapsibleSection>
    );
    // Collapsible content is usually hidden with attributes or CSS
    // Radix Collapsible adds 'hidden' attribute when closed
    const content = screen.queryByText('Hidden Content');
    // Note: implementation detail of Radix UI Collapsible might keep it in DOM but hidden
    // or unmounted. Let's check visibility if it's in the document.
    if (content) {
      expect(content).not.toBeVisible();
    } else {
      expect(content).not.toBeInTheDocument();
    }
  });

  it('should render content when open', () => {
    render(
      <CollapsibleSection
        title="Test Section"
        open={true}
        onOpenChange={() => {}}
      >
        <div>Visible Content</div>
      </CollapsibleSection>
    );
    expect(screen.getByText('Visible Content')).toBeVisible();
  });

  it('should call onOpenChange when trigger is clicked', async () => {
    const handleOpenChange = vi.fn();
    const user = userEvent.setup();

    render(
      <CollapsibleSection
        title="Test Section"
        open={false}
        onOpenChange={handleOpenChange}
      >
        <div>Content</div>
      </CollapsibleSection>
    );

    await user.click(screen.getByText('Test Section'));
    expect(handleOpenChange).toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <CollapsibleSection
        title="Test Section"
        open={false}
        onOpenChange={() => {}}
        className="custom-class"
      >
        <div>Content</div>
      </CollapsibleSection>
    );
    // The className is applied to the root element (Collapsible)
    // We need to find the element with that class
    const element = container.querySelector('.custom-class');
    expect(element).toBeInTheDocument();
  });

  it('should rotate chevron when open', () => {
    const { container } = render(
      <CollapsibleSection
        title="Test Section"
        open={true}
        onOpenChange={() => {}}
      >
        <div>Content</div>
      </CollapsibleSection>
    );

    // We look for the chevron icon which should have rotate-180 class
    const chevron = container.querySelector('.lucide-chevron-down');
    expect(chevron).toHaveClass('rotate-180');
  });

  it('should not rotate chevron when closed', () => {
    const { container } = render(
      <CollapsibleSection
        title="Test Section"
        open={false}
        onOpenChange={() => {}}
      >
        <div>Content</div>
      </CollapsibleSection>
    );

    const chevron = container.querySelector('.lucide-chevron-down');
    expect(chevron).not.toHaveClass('rotate-180');
  });
});
