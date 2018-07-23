/*!
 * @license
 * Alfresco Example Content Application
 *
 * Copyright (C) 2005 - 2018 Alfresco Software Limited
 *
 * This file is part of the Alfresco Example Content Application.
 * If the software was purchased under a paid Alfresco license, the terms of
 * the paid license agreement will prevail.  Otherwise, the software is
 * provided under the following open source license terms:
 *
 * The Alfresco Example Content Application is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * The Alfresco Example Content Application is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alfresco. If not, see <http://www.gnu.org/licenses/>.
 */

import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { MinimalNodeEntity, MinimalNodeEntryEntity } from 'alfresco-js-api';
import { NodePermissionService } from '../../common/services/node-permission.service';
import { ContentApiService } from '../../services/content-api.service';
import { MatSnackBar } from '@angular/material';
import { TranslationService } from "@alfresco/adf-core";

@Component({
    selector: 'aca-info-drawer',
    templateUrl: './info-drawer.component.html'
})
export class InfoDrawerComponent implements OnInit, OnChanges {
    @Input() nodeId: string;

    @Input() node: MinimalNodeEntity;

    @Input() tabLimit = 3;

    selectionNodes: SelectionNode[] = new Array();

    selectedIndex: number;

    limitWarning: string;
    folderInfo: string;

    isLoading = false;
    displayNode: MinimalNodeEntryEntity;

    // Dès l'initialisation de la vue, chargement de la traduction dans la langue locale
    ngOnInit() {
        this.translation.get("APP.INFO_DRAWER.FOLDER_VIEW").subscribe(translation => {
          this.folderInfo = translation;
        });
        this.translation.get("APP.INFO_DRAWER.TAB_LIMIT_WARNING", {limit: this.tabLimit}).subscribe(translation => {
            this.limitWarning = translation;
        });
      }

    canUpdateNode(): boolean {
        if (this.displayNode) {
            return this.permission.check(this.displayNode, ['update']);
        }

        return false;
    }

    // Dès que l'utilisateur clique sur un onglet, l'index courant se met à jour.
    setCurrentTab(event: number) {
        this.selectedIndex = event;
    }

    // Ferme l'onglet correspondant à l'index courant.
    closeTab(){
        this.selectionNodes.splice(this.selectedIndex, 1);
    }

    // Met à jour la liste des onglets
    private updateSelectionNodeList(): void {
        const entry = this.node.entry;
        // Si le document est un fichier, il y a deux cas possibles:
        // - soit le document est déjà présent dans un onglet
        // - soit il n'est pas présent
        if (entry.isFile) {
            let alreadyIn: boolean = false;
            // On regarde si le document est déjà présent dans un onglet
            for (let selectionNode of this.selectionNodes) {
                if (entry.id == selectionNode.id) {
                    alreadyIn = true;
                    break;
                }
            }
            // Si l'onglet correspondant au document n'existe pas :
            if (!alreadyIn) {
                // On regarde si le nombre d'onglet est à son maximum puis deux cas se présentent :
                // si on peut encore ajouter un onglet alors on le fait
                if (!this.isSelectionNodeListFull()) {
                    this.selectionNodes.unshift({id: entry.id, name: entry.name});
                    this.selectedIndex = 0;
                // sinon on affiche un warning prévenant l'utilisateur qu'il est à son maximum d'onglet ouvert
                } else {
                    this.snackBar.open(this.limitWarning, '', {panelClass: 'warning-snackbar', duration: 2500});
                }
            // Si l'onglet correspondant au document existe, on replace l'onglet courant sur ce dernier.
            } else {
                this.selectedIndex = this.selectionNodes.findIndex(selectionNode => selectionNode.id === entry.id);
            }
        } else {
            // On n'affiche pas le message dans deux cas :
            // - folderInfo n'est pas chargé car le NgOnInit est appelé après le NgOnChange
            // - l'utilisateur n'est pas sur un onglet de prévisualisation
            if (this.folderInfo != null && this.selectedIndex <= this.selectionNodes.length - 1) {
                this.snackBar.open(this.folderInfo, '', {panelClass: 'info-snackbar', duration: 2500});
            }
        }
    }

    // Renvoie true si le nombre d'onglet est à sa limite
    private isSelectionNodeListFull(): boolean {
        return this.selectionNodes.length >= this.tabLimit;
    }

    get isFileSelected(): boolean {
        if (this.node && this.node.entry) {
            // workaround for shared files type.
            if (this.node.entry.nodeId) {
                return true;
            } else {
                return this.node.entry.isFile;
            }
        }
        return false;
    }

    constructor(
        public permission: NodePermissionService,
        private contentApi: ContentApiService,
        private snackBar: MatSnackBar,
        private translation: TranslationService
    ) {}

    ngOnChanges(changes: SimpleChanges) {
        if (this.node) {
            this.updateSelectionNodeList();
            const entry = this.node.entry;
            if (entry.nodeId) {
                this.loadNodeInfo(entry.nodeId);
            } else if ((<any>entry).guid) {
                // workaround for Favorite files
                this.loadNodeInfo(entry.id);
            } else {
                // workaround Recent
                if (this.isTypeImage(entry) && !this.hasAspectNames(entry)) {
                    this.loadNodeInfo(this.node.entry.id);
                } else {
                    this.displayNode = this.node.entry;
                }
            }
        }
    }

    private hasAspectNames(entry: MinimalNodeEntryEntity): boolean {
        return entry.aspectNames && entry.aspectNames.includes('exif:exif');
    }

    private isTypeImage(entry: MinimalNodeEntryEntity): boolean {
        if (entry && entry.content && entry.content.mimeType) {
            return entry.content.mimeType.includes('image/');
        }
        return false;
    }

    private loadNodeInfo(nodeId: string) {
        if (nodeId) {
            this.isLoading = true;

            this.contentApi.getNodeInfo(nodeId).subscribe(
                entity => {
                    this.displayNode = entity;
                    this.isLoading = false;
                },
                () => this.isLoading = false
            );
        }
    }
}

export class SelectionNode {
    id: string;
    name: string;
}
