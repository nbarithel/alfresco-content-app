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

import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MinimalNodeEntity, MinimalNodeEntryEntity } from 'alfresco-js-api';
import { NodePermissionService } from '../../common/services/node-permission.service';
import { ContentApiService } from '../../services/content-api.service';
import { MatSnackBar } from '@angular/material';

@Component({
    selector: 'aca-info-drawer',
    templateUrl: './info-drawer.component.html'
})
export class InfoDrawerComponent implements OnChanges {
    @Input() nodeId: string;

    @Input() node: MinimalNodeEntity;

    @Input() tabLimit: number = 3;

    selectionNodes: SelectionNode[] = new Array();

    selectedIndex: number;

    isLoading = false;
    displayNode: MinimalNodeEntryEntity;

    canUpdateNode(): boolean {
        if (this.displayNode) {
            return this.permission.check(this.displayNode, ['update']);
        }

        return false;
    }

    setCurrentTab(event: number) {
        this.selectedIndex = event;
    }

    private updateSelectionNodeList(): void {
        const entry = this.node.entry;
        if (entry.isFile) {
            let alreadyIn: boolean = false;
            for (let selectionNode of this.selectionNodes) {
                if (entry.id == selectionNode.id) {
                    alreadyIn = true;
                    break;
                }
            }
            if (!alreadyIn) {
                if (!this.isSelectionNodeListFull()) {
                    this.selectionNodes.unshift({'id': entry.id, 'name': entry.name});
                    this.selectedIndex = 0;
                } else {
                    this.snackBar.open("L'affichage est limité à " + this.tabLimit + " prévisualisations simultanées", '', { panelClass: 'warning-snackbar', duration: 2500 });
                }
            } else {
                this.selectedIndex = this.selectionNodes.findIndex(selectionNode => selectionNode.id === entry.id);
            }
        } else {
            this.snackBar.open("Pas de prévisualisation sur un répertoire", '', { panelClass: 'warning-snackbar', duration: 2500 });
        }
    }

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
        private snackBar: MatSnackBar
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
