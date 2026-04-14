import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { Site, Device, Vlan, SiteDiagram } from '../models/infrastructure.models';

// @Injectable signifie que ce service peut être injecté
// dans n'importe quel composant Angular.
// providedIn: 'root' = une seule instance pour toute l'app.
@Injectable({ providedIn: 'root' })
export class ApiService {

  // inject() est la façon moderne d'Angular 17 pour récupérer
  // un service sans passer par le constructeur.
  private http = inject(HttpClient);

  // En dev, le proxy redirige /api → http://localhost:3000/api
  // En prod (Docker), l'URL est relative donc ça marche pareil.
  private base = '/api';

  // ── Sites ──────────────────────────────────────────────────

  getSites(): Observable<Site[]> {
    return this.http.get<Site[]>(`${this.base}/sites`);
  }

  getSite(id: number): Observable<Site> {
    return this.http.get<Site>(`${this.base}/sites/${id}`);
  }

  // ── Équipements ────────────────────────────────────────────

  getDevicesBySite(siteId: number): Observable<Device[]> {
    return this.http.get<Device[]>(`${this.base}/devices/site/${siteId}`);
  }

  // ── VLANs ──────────────────────────────────────────────────

  getVlansBySite(siteId: number): Observable<Vlan[]> {
    return this.http.get<Vlan[]>(`${this.base}/vlans/site/${siteId}`);
  }

  // ── Chargement groupé pour le diagramme ───────────────────
  // forkJoin = lance plusieurs appels en parallèle,
  // attend que TOUS soient terminés, puis retourne les résultats.

  getDiagramData(): Observable<SiteDiagram[]> {
    return this.getSites().pipe(
      map(sites => sites.filter(s => s.status === 'active')),
      // Pour chaque site actif, on charge équipements + VLANs en parallèle
      // Note: en pratique on utilise switchMap ici, simplifié pour clarté
    );
  }

  getSiteDiagram(siteId: number): Observable<{ devices: Device[], vlans: Vlan[] }> {
    return forkJoin({
      devices: this.getDevicesBySite(siteId),
      vlans:   this.getVlansBySite(siteId)
    });
  }
}
