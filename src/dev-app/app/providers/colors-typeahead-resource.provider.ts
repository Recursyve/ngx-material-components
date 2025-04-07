import { Injectable } from "@angular/core";
import {
    NiceAsyncTypeaheadResourceProvider,
    NiceAsyncTypeaheadSearchResult
} from "@recursyve/ngx-material-components/typeahead";
import { Observable, of, throwError } from "rxjs";

export type NiceColors = {
    id: number;
    name: string;
    hex: string;
};

@Injectable()
export class ColorsTypeaheadResourceProvider extends NiceAsyncTypeaheadResourceProvider<NiceColors> {
    private readonly colors: NiceColors[] = [
        { id: 1, name: "Red", hex: "#ff0000" },
        { id: 2, name: "Green", hex: "#00ff00" },
        { id: 3, name: "Blue", hex: "#0000ff" },
        { id: 4, name: "Yellow", hex: "#ffff00" },
        { id: 5, name: "Purple", hex: "#ff00ff" },
        { id: 6, name: "Orange", hex: "#ffa500" },
        { id: 7, name: "Brown", hex: "#8b4513" },
        { id: 8, name: "Black", hex: "#000000" },
        { id: 9, name: "White", hex: "#ffffff" },
        { id: 10, name: "Gray", hex: "#808080" },
        { id: 11, name: "Cyan", hex: "#00ffff" },
        { id: 12, name: "Magenta", hex: "#ff00ff" },
        { id: 13, name: "Lime", hex: "#bfff00" },
        { id: 14, name: "Teal", hex: "#008080" },
        { id: 15, name: "Lavender", hex: "#e6e6fa" },
        { id: 16, name: "Pink", hex: "#ffc0cb" },
        { id: 17, name: "Maroon", hex: "#800000" },
        { id: 18, name: "Olive", hex: "#808000" },
        { id: 19, name: "Navy", hex: "#000080" },
        { id: 20, name: "Gold", hex: "#ffd700" },
        { id: 21, name: "Beige", hex: "#f5f5dc" },
        { id: 22, name: "Chocolate", hex: "#d2691e" },
        { id: 23, name: "Coral", hex: "#ff7f50" },
        { id: 24, name: "Crimson", hex: "#dc143c" },
        { id: 25, name: "Ivory", hex: "#fffff0" },
        { id: 26, name: "Khaki", hex: "#f0e68c" },
        { id: 27, name: "Mint", hex: "#98ff98" },
        { id: 28, name: "Peach", hex: "#ffdab9" },
        { id: 29, name: "Plum", hex: "#dda0dd" },
        { id: 30, name: "Orchid", hex: "#da70d6" },
        { id: 31, name: "Salmon", hex: "#fa8072" },
        { id: 32, name: "Slate", hex: "#708090" },
        { id: 33, name: "Turquoise", hex: "#40e0d0" },
        { id: 34, name: "Violet", hex: "#ee82ee" },
        { id: 35, name: "Amber", hex: "#ffbf00" },
        { id: 36, name: "Azure", hex: "#007fff" },
        { id: 37, name: "Bisque", hex: "#ffe4c4" },
        { id: 38, name: "Chartreuse", hex: "#7fff00" },
        { id: 39, name: "Fuchsia", hex: "#ff00ff" },
        { id: 40, name: "Indigo", hex: "#4b0082" },
        { id: 41, name: "Lemon", hex: "#fff44f" },
        { id: 42, name: "Periwinkle", hex: "#ccccff" },
        { id: 43, name: "Ruby", hex: "#e0115f" },
        { id: 44, name: "Sapphire", hex: "#0f52ba" },
        { id: 45, name: "SeaGreen", hex: "#2e8b57" },
        { id: 46, name: "Tan", hex: "#d2b48c" },
        { id: 47, name: "Thistle", hex: "#d8bfd8" },
        { id: 48, name: "Wheat", hex: "#f5deb3" },
        { id: 49, name: "Terracotta", hex: "#e2725b" },
        { id: 50, name: "Cherry", hex: "#de3163" }
    ];

    public resource = "colors";

    public override search(searchQuery: string, page: number): Observable<NiceAsyncTypeaheadSearchResult<NiceColors>> {
        const pageSize = 10; // Number of results per page
        const lowerCaseSearchQuery = searchQuery.toLowerCase();

        // Filter colors based on the search query
        const filteredColors = this.colors.filter(color =>
            color.name.toLowerCase().includes(lowerCaseSearchQuery)
        );

        // Determine start and end indexes for pagination
        const startIndex = page * pageSize;
        const endIndex = startIndex + pageSize;

        // Paginate the filtered results
        const paginatedColors = filteredColors.slice(startIndex, endIndex);

        // Return the paginated results in the expected format
        return of({
            items: paginatedColors.map(color => ({ ...color })),
            nextPage: endIndex < filteredColors.length ? page + 1 : null
        });
    }

    public override getById(id: number): Observable<NiceColors> {
        const color = this.colors.find(color => color.id === id);
        if (color) {
            return of(color);
        }

        return throwError(() => new Error("No colors found for id: " + id + "."));
    }

    public override format(item: NiceColors): string {
        return `${item.name} (${item.hex.toUpperCase()})`;
    }
}
