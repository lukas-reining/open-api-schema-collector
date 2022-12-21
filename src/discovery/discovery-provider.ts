export type StaticDiscoveryProvider = {
  type: 'static';
  paths: string[];
};

export type AwsEcsDiscoveryProvider = {
  type: 'aws_ecs';
  clusterArns: string[];
};
export type DiscoveryProvider =
  | StaticDiscoveryProvider
  | AwsEcsDiscoveryProvider;

export type DiscoveryProviders = DiscoveryProvider[];
