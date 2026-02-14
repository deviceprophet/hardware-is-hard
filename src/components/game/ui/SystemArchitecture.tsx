import React from 'react';
import { Cloud, Wifi, Cpu, HardDrive, Battery, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SystemArchitectureProps {
    activeTags: readonly string[];
}

interface NodeStatus {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    tags: string[]; // Tags that affect this node positively or negatively (mostly negative for now)
}

export const SystemArchitecture: React.FC<SystemArchitectureProps> = React.memo(
    ({ activeTags }) => {
        const { t } = useTranslation();

        // Define the system nodes
        const nodes: NodeStatus[] = [
            {
                id: 'cloud',
                label: t('system.nodes.cloud.label'),
                description: t('system.nodes.cloud.description'),
                icon: <Cloud size={20} />,
                tags: [
                    'cloud_dependency',
                    'gdpr_violation',
                    'server_crash',
                    'privacy_risk',
                    'ai_gap_data_sheet_missing'
                ]
            },
            {
                id: 'network',
                label: t('system.nodes.network.label'),
                description: t('system.nodes.network.description'),
                icon: <Wifi size={20} />,
                tags: ['cheap_wifi', 'no_encryption', 'default_password']
            },
            {
                id: 'compute',
                label: t('system.nodes.compute.label'),
                description: t('system.nodes.compute.description'),
                icon: <Cpu size={20} />,
                tags: ['cheapest_mcu', 'cloned', 'tech_debt', 'ai_gap_transparency_missing']
            },
            {
                id: 'storage',
                label: t('system.nodes.storage.label'),
                description: t('system.nodes.storage.description'),
                icon: <HardDrive size={20} />,
                tags: ['bad_flash', 'data_loss', 'unencrypted_fs']
            },
            {
                id: 'power',
                label: t('system.nodes.power.label'),
                description: t('system.nodes.power.description'),
                icon: <Battery size={20} />,
                tags: ['thermal_issues', 'cheap_battery', 'battery_risk', 'children_safety']
            },
            {
                id: 'security',
                label: t('system.nodes.security.label'),
                description: t('system.nodes.security.description'),
                icon: <Shield size={20} />,
                tags: [
                    'critical_vuln',
                    'expired_cert',
                    'root_shell',
                    'regulatory_risk',
                    'legal_liability'
                ]
            }
        ];

        // Helper to determine node health based on tags
        const getNodeHealth = (nodeTags: string[]) => {
            const activeIssues = nodeTags.filter(t => activeTags.includes(t));
            if (activeIssues.length > 0) return 'critical';
            return 'nominal';
        };

        return (
            <div
                className="p-4 rounded-lg bg-slate-900/50 border border-slate-700"
                role="region"
                aria-label="System Architecture Diagram"
                data-testid="system-architecture"
            >
                <h2 className="text-sm font-bold uppercase tracking-wider mb-4 text-slate-400 text-center">
                    {t('system.title')}
                </h2>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {nodes.map(node => {
                        const health = getNodeHealth(node.tags);
                        const isCritical = health === 'critical';

                        return (
                            <div
                                key={node.id}
                                className={`
                                relative group p-3 rounded border transition-all duration-300 flex flex-col h-full
                                ${
                                    isCritical
                                        ? 'bg-red-900/20 border-red-500/50 animate-pulse-red'
                                        : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                                }
                            `}
                            >
                                {/* Line 1: Header + Status */}
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={`${isCritical ? 'text-red-400' : 'text-slate-400'}`}
                                        >
                                            {node.icon}
                                        </div>
                                        <span
                                            className={`font-mono font-bold text-sm ${isCritical ? 'text-red-400' : 'text-slate-200'}`}
                                        >
                                            {node.label}
                                        </span>
                                    </div>

                                    {/* Status Indicator */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <div
                                            className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-red-500 animate-ping' : 'bg-green-500'}`}
                                        />
                                        <span
                                            className={`text-[10px] uppercase tracking-wider ${isCritical ? 'text-red-400 font-bold' : 'text-slate-400'}`}
                                        >
                                            {isCritical
                                                ? t('system.status.warning')
                                                : t('system.status.nominal')}
                                        </span>
                                    </div>
                                </div>

                                {/* Line 2: Active Issues - Always Visible if critical */}
                                {isCritical && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {node.tags
                                            .filter(t => activeTags.includes(t))
                                            .map(tag => (
                                                <span
                                                    key={tag}
                                                    className="text-[10px] bg-red-950/50 text-red-200 px-1.5 py-0.5 rounded border border-red-800/50 max-w-full truncate"
                                                >
                                                    {t(`system.tags.${tag}`, {
                                                        defaultValue: tag
                                                            .replace(/_/g, ' ')
                                                            .toUpperCase()
                                                    })}
                                                </span>
                                            ))}
                                    </div>
                                )}

                                {/* Tooltip (Description only) */}
                                <div className="absolute z-20 bottom-full left-0 w-full mb-2 hidden group-hover:block animate-fade-in opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <div className="bg-slate-900 text-white text-xs p-2 rounded border border-slate-600 shadow-xl backdrop-blur-sm">
                                        <p className="font-bold text-white mb-1">{node.label}</p>
                                        <p>{node.description}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4 text-[10px] text-center text-slate-400">
                    {t('system.hoverHint')}
                </div>
            </div>
        );
    }
);

SystemArchitecture.displayName = 'SystemArchitecture';
