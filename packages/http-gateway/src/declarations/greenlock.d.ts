declare module 'greenlock' {
  interface Manager {
    defaults(defaults: { subscriberEmail?: string; agreeToTerms?: boolean }): Promise<any>;
  }

  interface Challenges {
    get(defaults: {
      servername: string;
      token: string;
    }): Promise<{ keyAuthorization: string } | null>;
  }

  interface Site {
    site: {
      subject: string; //Domain name
      altnames: string[];
      renewAt: number;
    };
    pems: {
      cert: string;
      chain: string;
      privkey: string;
      subject: string; //Domain name
      altnames: string[];
      issuedAt: number;
      expiresAt: number;
    };
  }

  interface Greenlock {
    manager: Manager;
    challenges: Challenges;

    add(args: { subject: string; altnames: string[] }): Promise<any>;

    get(args: { servername: string }): Promise<Site>;

    renew(): Promise<any[]>;

    remove({ subject }): Promise<any>;
  }

  interface GLConfig {
    packageRoot: string;
    configDir: string;
    packageAgent: string;
    maintainerEmail: string;
    staging?: boolean;
    notify?: (evt: any, details: any) => void;
    challenges?: {
      ['http-01' | 'dns-01' | 'tls-alpn-01']?: {
        module: string;
        [key: string]: any;
      };
    };
  }

  function create(config: GLConfig): Greenlock;
}
