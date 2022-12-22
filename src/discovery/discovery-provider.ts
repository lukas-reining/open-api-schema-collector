export type StaticDiscoveryProvider = {
  type: 'static';
  path: string;
};

export type KubernetesDiscoveryProvider = {
  type: 'kubernetes';
};

export type AwsEcsDiscoveryProvider = {
  type: 'aws_ecs';
  clusterArns: string[];
};

export type DiscoveryProvider =
  | StaticDiscoveryProvider
  | KubernetesDiscoveryProvider
  | AwsEcsDiscoveryProvider;

export type DiscoveryProviders = DiscoveryProvider[];
