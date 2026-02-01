import { CourtStatus } from '@/types/beach-tennis';

interface CourtStatusBadgeProps {
  status: CourtStatus;
}

const statusConfig: Record<CourtStatus, { label: string; className: string }> = {
  livre: {
    label: 'LIVRE',
    className: 'bg-success/10 text-success border-success/30',
  },
  em_jogo: {
    label: 'EM JOGO',
    className: 'status-live',
  },
  pausada: {
    label: 'PAUSADA',
    className: 'status-waiting',
  },
  manutencao: {
    label: 'MANUTENÇÃO',
    className: 'status-maintenance',
  },
};

export const CourtStatusBadge = ({ status }: CourtStatusBadgeProps) => {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${config.className}`}
    >
      {config.label}
    </span>
  );
};
