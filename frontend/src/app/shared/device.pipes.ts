import { Pipe, PipeTransform } from '@angular/core';
import { DeviceType, LinkType } from '../core/infrastructure.models';

// Un Pipe transforme une valeur dans un template Angular.
// Exemple : {{ device.type | deviceLabel }} → "Routeur WireGuard"
// Plutôt que d'écrire la logique dans chaque composant.

@Pipe({ name: 'deviceLabel', standalone: true })
export class DeviceLabelPipe implements PipeTransform {
  transform(type: DeviceType): string {
    const labels: Record<DeviceType, string> = {
      router:      'Routeur',
      switch:      'Switch',
      server:      'Serveur / VM',
      nas:         'NAS / Stockage',
      pbs:         'Backup Server',
      ha:          'Domotique',
      gns:         'LAB réseau',
      ap:          'Borne Wi-Fi',
      placeholder: 'À venir',
    };
    return labels[type] ?? type;
  }
}

@Pipe({ name: 'linkLabel', standalone: true })
export class LinkLabelPipe implements PipeTransform {
  transform(link: LinkType): string {
    const labels: Record<LinkType, string> = {
      fiber:    'Fibre OM4 SFP+ 10G',
      sfp:      'SFP+ 10G',
      rj45:     'RJ45 1G',
      'rj45-4x': '4× RJ45 1G LACP',
    };
    return labels[link] ?? link;
  }
}

@Pipe({ name: 'vlanColor', standalone: true })
export class VlanColorPipe implements PipeTransform {
  transform(vlanNumber: number | undefined): string {
    const colors: Record<number, string> = {
      10: '#a78bfa',
      20: '#fbbf24',
      30: '#fb7185',
      40: '#4ade80',
      50: '#2dd4bf',
      60: '#9ca3af',
    };
    return vlanNumber != null ? (colors[vlanNumber] ?? '#6b7280') : '#4b5563';
  }
}
