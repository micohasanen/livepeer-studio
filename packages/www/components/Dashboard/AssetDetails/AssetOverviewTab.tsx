import {
  Link as A,
  Box,
  Button,
  Flex,
  styled,
  Heading,
  Promo,
  Text,
  useSnackbar,
} from "@livepeer/design-system";

import { Asset } from "@livepeer.studio/api";
import { CopyIcon } from "@radix-ui/react-icons";
import { useCallback, useMemo, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";

import IpfsIcon from "../../../public/img/icons/ipfs-logo.svg";
import CurlyBracesIcon from "../../../public/img/icons/curly-braces.svg";
import DatabaseIcon from "../../../public/img/icons/database.svg";
import { useApi } from "hooks";
import Spinner from "../Spinner";

const StyledIpfsIcon = styled(IpfsIcon, {
  color: "$gray",
  mr: "$2",
});

const StyledCurlyBracesIcon = styled(CurlyBracesIcon, {
  color: "$gray",
  mr: "$2",
});

const StyledDatabaseIcon = styled(DatabaseIcon, {
  color: "$gray",
  mr: "$2",
});

const AssetOverviewTab = ({
  asset,
  onEditAsset,
}: {
  asset?: Asset | null;
  onEditAsset: () => void;
}) => {
  const { patchAsset } = useApi();

  // uploading state will exist until the asset is refetched by polling & ipfs CID exists
  const [isUploading, setIsUploading] = useState(false);

  const onClickUploadIpfs = useCallback(async () => {
    setIsUploading(true);

    if (asset?.id) {
      await patchAsset(asset.id, {
        storage: {
          ipfs: true,
        },
      });
    }
  }, [asset, patchAsset]);

  const [openSnackbar] = useSnackbar();

  const metadataStringified = useMemo(
    () => (asset?.meta ? JSON.stringify(asset.meta, null, 4) : ""),
    [asset?.meta]
  );

  return (
    <>
      <Box>
        <Box
          css={{
            mb: "$3",
            width: "100%",
          }}>
          <Flex css={{ mb: "$2" }} align="center">
            <StyledCurlyBracesIcon />
            <Heading size="1" css={{ fontWeight: 500 }}>
              Metadata
            </Heading>
          </Flex>
          <Text variant="gray" size="2">
            A list of key value pairs that you use to provide metadata for your
            video.{" "}
            <A css={{ cursor: "pointer" }} onClick={onEditAsset}>
              Edit asset
            </A>{" "}
            to add metadata.
          </Text>
        </Box>
        <Promo size="2" css={{ mb: "$5" }}>
          {metadataStringified ? (
            <CopyToClipboard
              text={metadataStringified}
              onCopy={() => openSnackbar("Copied metadata to clipboard")}>
              <Flex
                align="center"
                css={{
                  cursor: "pointer",
                  justifyContent: "space-between",
                }}>
                <Text variant="gray" size="2">
                  {metadataStringified}
                </Text>

                <Box>
                  <CopyIcon />
                </Box>
              </Flex>
            </CopyToClipboard>
          ) : (
            <Text
              size="3"
              css={{
                mr: "$1",
              }}>
              No metadata yet
            </Text>
          )}
        </Promo>

        <Box
          css={{
            mb: "$3",
            width: "100%",
          }}>
          <Flex css={{ mb: "$2" }} align="center">
            <StyledDatabaseIcon />
            <Heading size="1" css={{ fontWeight: 500 }}>
              Decentralized Storage Providers
            </Heading>
          </Flex>
          <Text variant="gray" size="2">
            By default video assets are stored in the Livepeer Studio database,
            but you may also replicate them to the following decentralized
            storage providers.
          </Text>
        </Box>
        <Promo size="2">
          <Flex css={{ justifyContent: "space-between" }}>
            <Flex align="center">
              <StyledIpfsIcon />
              <Text size="3">IPFS</Text>
            </Flex>

            {!asset?.storage?.ipfs?.cid && (
              <>
                <Button
                  onClick={onClickUploadIpfs}
                  css={{
                    display: "inline-flex",
                    ai: "center",
                  }}
                  size="2"
                  disabled={
                    Boolean(asset?.status?.phase !== "ready") || isUploading
                  }
                  variant="primary">
                  {isUploading && (
                    <Spinner
                      css={{
                        color: "$hiContrast",
                        width: 16,
                        height: 16,
                        mr: "$2",
                      }}
                    />
                  )}
                  <Box>Save to IPFS</Box>
                </Button>
              </>
            )}
          </Flex>
          {asset?.storage?.ipfs?.cid && (
            <Box css={{ mt: "$3" }}>
              <CopyToClipboard
                text={`ipfs://${asset.storage.ipfs.cid}`}
                onCopy={() => openSnackbar("Copied IPFS CID to clipboard")}>
                <Flex css={{ cursor: "pointer" }}>
                  <Box>
                    <Flex align="center">
                      <Text
                        size="2"
                        css={{
                          fontSize: "14px",
                          mr: "$1",
                          fontWeight: 500,
                        }}>
                        Content Hash
                      </Text>
                      <CopyIcon />
                    </Flex>
                    <Text
                      variant="gray"
                      size="2"
                      css={{ mt: "$1", lineHeight: 1.4 }}>
                      ipfs://{asset?.storage?.ipfs?.cid}
                    </Text>
                  </Box>
                </Flex>
              </CopyToClipboard>
            </Box>
          )}
        </Promo>
      </Box>
    </>
  );
};

export default AssetOverviewTab;
