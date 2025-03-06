import { meta } from '@pulumi/kubernetes/types/input';

export type MatchLabels = meta.v1.LabelSelector['matchLabels'];
