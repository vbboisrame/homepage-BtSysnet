import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { Site, Device, Vlan } from './infrastructure.models';

@Injectable({ providedIn: 'root' })
export class ApiService {

  private http = inject(HttpClient);
  private base = '/api';

  // ── Sites ──────────────────────────────────────────────────

  getSites(): Observable<Site[]> {
    return this.http.get<Site[]>(`${this.base}/sites`);
  }

  createSite(data: Partial<Site>): Observable<Site> {
    return this.http.post<Site>(`${this.base}/sites`, data);
  }

  updateSite(id: number, data: Partial<Site>): Observable<Site> {
    return this.http.put<Site>(`${this.base}/sites/${id}`, data);
  }

  deleteSite(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/sites/${id}`);
  }

  // ── Équipements ────────────────────────────────────────────

  getAllDevices(): Observable<Device[]> {
    return this.http.get<Device[]>(`${this.base}/devices`);
  }

  getDevicesBySite(siteId: number): Observable<Device[]> {
    return this.http.get<Device[]>(`${this.base}/devices/site/${siteId}`);
  }

  createDevice(data: Partial<Device>): Observable<Device> {
    return this.http.post<Device>(`${this.base}/devices`, data);
  }

  updateDevice(id: number, data: Partial<Device>): Observable<Device> {
    return this.http.put<Device>(`${this.base}/devices/${id}`, data);
  }

  deleteDevice(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/devices/${id}`);
  }

  // ── VLANs ──────────────────────────────────────────────────

  getVlansBySite(siteId: number): Observable<Vlan[]> {
    return this.http.get<Vlan[]>(`${this.base}/vlans/site/${siteId}`);
  }

  createVlan(data: Partial<Vlan>): Observable<Vlan> {
    return this.http.post<Vlan>(`${this.base}/vlans`, data);
  }

  updateVlan(id: number, data: Partial<Vlan>): Observable<Vlan> {
    return this.http.put<Vlan>(`${this.base}/vlans/${id}`, data);
  }

  deleteVlan(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/vlans/${id}`);
  }

  // ── Chargement groupé ─────────────────────────────────────

  getSiteDiagram(siteId: number): Observable<{ devices: Device[], vlans: Vlan[] }> {
    return forkJoin({
      devices: this.getDevicesBySite(siteId),
      vlans:   this.getVlansBySite(siteId)
    });
  }
}
