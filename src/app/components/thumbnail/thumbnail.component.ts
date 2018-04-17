/*!
 * @license
 * Copyright 2016 Alfresco Software, Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Component, Input, OnInit } from '@angular/core';
import {
    AlfrescoApiService
} from '@alfresco/adf-core';

@Component({
    selector: 'adf-thumbnail',
    templateUrl: 'thumbnail.component.html',
    styleUrls: ['thumbnail.component.scss']
})
export class ThumbnailComponent implements OnInit {

    @Input()
    node;

    urlFile;

    constructor(private apiService: AlfrescoApiService) {
    }

    ngOnInit() {
        // console.log(this.node);

        if (this.node.isFile && this.node.content.mimeType.includes('image')) {
            this.urlFile = this.apiService.getInstance().content.getContentUrl(this.node.id);
        }
    }

}
