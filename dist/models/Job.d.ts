import { Schema } from "mongoose";
export declare const JobModel: import("mongoose").Model<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    id: string;
    title: string;
    company: string;
    location: string;
    jdUrl: string;
    platform: string;
    collectedAt: NativeDate;
    jd?: string | null | undefined;
    salary?: string | null | undefined;
    salaryMin?: number | null | undefined;
    salaryMax?: number | null | undefined;
    postedAt?: NativeDate | null | undefined;
    remote?: boolean | null | undefined;
    match?: {
        matchedSkills: string[];
        matchedLocations: string[];
        score?: number | null | undefined;
    } | null | undefined;
}, {}, {}, {}, import("mongoose").Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    id: string;
    title: string;
    company: string;
    location: string;
    jdUrl: string;
    platform: string;
    collectedAt: NativeDate;
    jd?: string | null | undefined;
    salary?: string | null | undefined;
    salaryMin?: number | null | undefined;
    salaryMax?: number | null | undefined;
    postedAt?: NativeDate | null | undefined;
    remote?: boolean | null | undefined;
    match?: {
        matchedSkills: string[];
        matchedLocations: string[];
        score?: number | null | undefined;
    } | null | undefined;
}, {}, {
    timestamps: true;
}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    id: string;
    title: string;
    company: string;
    location: string;
    jdUrl: string;
    platform: string;
    collectedAt: NativeDate;
    jd?: string | null | undefined;
    salary?: string | null | undefined;
    salaryMin?: number | null | undefined;
    salaryMax?: number | null | undefined;
    postedAt?: NativeDate | null | undefined;
    remote?: boolean | null | undefined;
    match?: {
        matchedSkills: string[];
        matchedLocations: string[];
        score?: number | null | undefined;
    } | null | undefined;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, Schema<any, import("mongoose").Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    id: string;
    title: string;
    company: string;
    location: string;
    jdUrl: string;
    platform: string;
    collectedAt: NativeDate;
    jd?: string | null | undefined;
    salary?: string | null | undefined;
    salaryMin?: number | null | undefined;
    salaryMax?: number | null | undefined;
    postedAt?: NativeDate | null | undefined;
    remote?: boolean | null | undefined;
    match?: {
        matchedSkills: string[];
        matchedLocations: string[];
        score?: number | null | undefined;
    } | null | undefined;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    id: string;
    title: string;
    company: string;
    location: string;
    jdUrl: string;
    platform: string;
    collectedAt: NativeDate;
    jd?: string | null | undefined;
    salary?: string | null | undefined;
    salaryMin?: number | null | undefined;
    salaryMax?: number | null | undefined;
    postedAt?: NativeDate | null | undefined;
    remote?: boolean | null | undefined;
    match?: {
        matchedSkills: string[];
        matchedLocations: string[];
        score?: number | null | undefined;
    } | null | undefined;
}>, {}, import("mongoose").ResolveSchemaOptions<{
    timestamps: true;
}>> & import("mongoose").FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    id: string;
    title: string;
    company: string;
    location: string;
    jdUrl: string;
    platform: string;
    collectedAt: NativeDate;
    jd?: string | null | undefined;
    salary?: string | null | undefined;
    salaryMin?: number | null | undefined;
    salaryMax?: number | null | undefined;
    postedAt?: NativeDate | null | undefined;
    remote?: boolean | null | undefined;
    match?: {
        matchedSkills: string[];
        matchedLocations: string[];
        score?: number | null | undefined;
    } | null | undefined;
}> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>>;
